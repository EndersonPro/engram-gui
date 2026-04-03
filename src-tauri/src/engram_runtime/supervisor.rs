use std::{
    process::{Child, Command, Stdio},
    thread,
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};

use crate::{
    commands::LifecycleCommandError,
    engram_runtime::{AppState, HealthMetadata, RuntimeSnapshot},
};

const HEALTH_TIMEOUT: Duration = Duration::from_secs(3);
const HEALTH_POLL_INTERVAL: Duration = Duration::from_millis(100);
const STOP_GRACEFUL_TIMEOUT: Duration = Duration::from_millis(150);
const STOP_KILL_WAIT_TIMEOUT: Duration = Duration::from_millis(500);
const STOP_POLL_INTERVAL: Duration = Duration::from_millis(25);

#[derive(Debug, Clone, Copy)]
struct StopPolicy {
    graceful_timeout: Duration,
    kill_wait_timeout: Duration,
    poll_interval: Duration,
}

impl Default for StopPolicy {
    fn default() -> Self {
        Self {
            graceful_timeout: STOP_GRACEFUL_TIMEOUT,
            kill_wait_timeout: STOP_KILL_WAIT_TIMEOUT,
            poll_interval: STOP_POLL_INTERVAL,
        }
    }
}

trait ManagedProcess {
    fn id(&self) -> u32;
    fn try_wait_exited(&mut self) -> Result<bool, String>;
    fn kill_force(&mut self) -> Result<(), String>;
}

impl ManagedProcess for Child {
    fn id(&self) -> u32 {
        Child::id(self)
    }

    fn try_wait_exited(&mut self) -> Result<bool, String> {
        self.try_wait()
            .map(|status| status.is_some())
            .map_err(|error| format!("cannot poll process state: {error}"))
    }

    fn kill_force(&mut self) -> Result<(), String> {
        self.kill()
            .map_err(|error| format!("cannot kill process: {error}"))
    }
}

#[derive(Debug)]
enum StopTerminationError {
    ProbeFailed(String),
    KillFailed(String),
    TimeoutAfterKill { pid: u32, timeout: Duration },
}

impl StopTerminationError {
    fn code(&self) -> &'static str {
        match self {
            Self::ProbeFailed(_) => "STOP_FAILED",
            Self::KillFailed(_) => "STOP_KILL_FAILED",
            Self::TimeoutAfterKill { .. } => "STOP_TIMEOUT",
        }
    }

    fn message(&self) -> String {
        match self {
            Self::ProbeFailed(message) | Self::KillFailed(message) => message.clone(),
            Self::TimeoutAfterKill { pid, timeout } => format!(
                "Timed out after {}ms waiting process {pid} to terminate after kill escalation",
                timeout.as_millis()
            ),
        }
    }
}

fn checked_at_now() -> String {
    let seconds = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|value| value.as_secs())
        .unwrap_or(0);
    format!("{seconds}")
}

fn probe_health(api_base_url: &str) -> Result<HealthMetadata, String> {
    let url = format!("{}/health", api_base_url.trim_end_matches('/'));
    let response = reqwest::blocking::get(url).map_err(|error| error.to_string())?;
    let status_code = response.status();

    if !status_code.is_success() {
        return Err(format!("health status {status_code}"));
    }

    let payload = response
        .json::<serde_json::Value>()
        .map_err(|error| format!("cannot decode health payload: {error}"))?;

    let status = payload
        .get("status")
        .and_then(|value| value.as_str())
        .unwrap_or("ok")
        .to_string();
    let version = payload
        .get("version")
        .and_then(|value| value.as_str())
        .map(ToString::to_string);

    Ok(HealthMetadata {
        status,
        checked_at: checked_at_now(),
        version,
    })
}

fn wait_until_exit<P: ManagedProcess>(
    process: &mut P,
    timeout: Duration,
    poll_interval: Duration,
) -> Result<bool, String> {
    let deadline = Instant::now() + timeout;

    loop {
        if process.try_wait_exited()? {
            return Ok(true);
        }

        if Instant::now() >= deadline {
            return Ok(false);
        }

        thread::sleep(poll_interval);
    }
}

fn terminate_process_with_policy<P: ManagedProcess>(
    process: &mut P,
    policy: StopPolicy,
) -> Result<(), StopTerminationError> {
    if wait_until_exit(process, policy.graceful_timeout, policy.poll_interval)
        .map_err(StopTerminationError::ProbeFailed)?
    {
        return Ok(());
    }

    process
        .kill_force()
        .map_err(StopTerminationError::KillFailed)?;

    let exited = wait_until_exit(process, policy.kill_wait_timeout, policy.poll_interval)
        .map_err(StopTerminationError::ProbeFailed)?;

    if exited {
        return Ok(());
    }

    Err(StopTerminationError::TimeoutAfterKill {
        pid: process.id(),
        timeout: policy.kill_wait_timeout,
    })
}

fn terminate_process(child: &mut Child) -> Result<(), StopTerminationError> {
    terminate_process_with_policy(child, StopPolicy::default())
}

pub fn start(state: &AppState) -> Result<RuntimeSnapshot, LifecycleCommandError> {
    let config = state.config_store.get();
    let binary_path = config.binary_path.clone().ok_or(LifecycleCommandError {
        code: "BINARY_UNAVAILABLE",
        message: "Engram binary is missing. Configure binary_path before lifecycle actions."
            .to_string(),
    })?;

    let mut managed_process = state
        .managed_process
        .lock()
        .expect("managed process lock poisoned");

    if let Some(existing) = managed_process.as_mut() {
        if existing.try_wait().ok().flatten().is_none() {
            let mut runtime = state.runtime.lock().expect("runtime lock poisoned");
            runtime.process_state = crate::commands::status::RuntimeProcessState::Running;
            runtime.failure_reason = None;
            runtime.managed_pid = Some(existing.id());
            return Ok(runtime.clone());
        }

        *managed_process = None;
    }

    let mut child = Command::new(binary_path)
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|error| LifecycleCommandError {
            code: "START_FAILED",
            message: format!("Cannot start Engram runtime: {error}"),
        })?;

    {
        let mut runtime = state.runtime.lock().expect("runtime lock poisoned");
        runtime.mark_starting(child.id());
    }

    let deadline = Instant::now() + HEALTH_TIMEOUT;

    loop {
        if let Ok(health) = probe_health(&config.api_base_url) {
            let pid = child.id();
            *managed_process = Some(child);

            let mut runtime = state.runtime.lock().expect("runtime lock poisoned");
            runtime.managed_pid = Some(pid);
            runtime.mark_running(health);
            return Ok(runtime.clone());
        }

        if Instant::now() >= deadline {
            let _ = terminate_process(&mut child);

            let mut runtime = state.runtime.lock().expect("runtime lock poisoned");
            runtime.managed_pid = None;
            runtime.mark_error("START_HEALTH_TIMEOUT");

            return Err(LifecycleCommandError {
                code: "START_HEALTH_TIMEOUT",
                message: "Engram runtime started but never became healthy within timeout"
                    .to_string(),
            });
        }

        thread::sleep(HEALTH_POLL_INTERVAL);
    }
}

pub fn stop(state: &AppState) -> Result<RuntimeSnapshot, LifecycleCommandError> {
    let mut managed_process = state
        .managed_process
        .lock()
        .expect("managed process lock poisoned");

    let Some(child) = managed_process.as_mut() else {
        return Err(LifecycleCommandError {
            code: "ALREADY_STOPPED",
            message: "Engram runtime is already stopped.".to_string(),
        });
    };

    if let Err(error) = terminate_process(child) {
        let mut runtime = state.runtime.lock().expect("runtime lock poisoned");
        runtime.mark_error(error.code());

        return Err(LifecycleCommandError {
            code: error.code(),
            message: error.message(),
        });
    }

    *managed_process = None;

    let mut runtime = state.runtime.lock().expect("runtime lock poisoned");
    runtime.mark_idle();
    Ok(runtime.clone())
}

pub fn restart(state: &AppState) -> Result<RuntimeSnapshot, LifecycleCommandError> {
    match stop(state) {
        Ok(_) => {}
        Err(error) if error.code == "ALREADY_STOPPED" => {}
        Err(error) => return Err(error),
    }

    start(state)
}

#[cfg(test)]
mod tests {
    use std::{
        fs,
        io::{Read, Write},
        net::TcpListener,
        path::PathBuf,
        sync::Arc,
        time::{Duration, SystemTime, UNIX_EPOCH},
    };

    use crate::{
        commands::status::RuntimeProcessState,
        engram_runtime::{config::EngramConfig, AppState},
    };

    use super::{restart, start, stop, terminate_process_with_policy, ManagedProcess, StopPolicy};

    fn unique_suffix() -> u128 {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("time went backwards")
            .as_nanos()
    }

    fn write_runtime_script() -> PathBuf {
        let path = std::env::temp_dir()
            .join("engram-gui-tests")
            .join(format!("runtime-{}.sh", unique_suffix()));
        fs::create_dir_all(path.parent().expect("runtime script parent should exist"))
            .expect("runtime script directory should be created");
        fs::write(&path, "#!/bin/sh\nwhile true; do sleep 1; done\n")
            .expect("runtime script should be written");

        let mut permissions = fs::metadata(&path)
            .expect("runtime script metadata should exist")
            .permissions();
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            permissions.set_mode(0o755);
            fs::set_permissions(&path, permissions).expect("runtime script should be executable");
        }

        path
    }

    fn start_health_server() -> String {
        let listener = TcpListener::bind("127.0.0.1:0").expect("health server should bind");
        let address = listener
            .local_addr()
            .expect("health server should have addr");

        std::thread::spawn(move || {
            for incoming in listener.incoming() {
                let mut stream = match incoming {
                    Ok(stream) => stream,
                    Err(_) => break,
                };
                let mut buffer = [0_u8; 512];
                let _ = stream.read(&mut buffer);
                let body = r#"{"status":"ok","version":"test"}"#;
                let response = format!(
                    "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
                    body.len(),
                    body
                );
                let _ = stream.write_all(response.as_bytes());
            }
        });

        format!("http://{}", address)
    }

    fn start_delayed_health_server(delay: Duration) -> String {
        let listener = TcpListener::bind("127.0.0.1:0").expect("delayed health server should bind");
        let address = listener
            .local_addr()
            .expect("delayed health server should have addr");

        std::thread::spawn(move || {
            for incoming in listener.incoming() {
                let mut stream = match incoming {
                    Ok(stream) => stream,
                    Err(_) => break,
                };

                std::thread::sleep(delay);

                let mut buffer = [0_u8; 512];
                let _ = stream.read(&mut buffer);
                let body = r#"{"status":"ok","version":"delayed"}"#;
                let response = format!(
                    "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
                    body.len(),
                    body
                );
                let _ = stream.write_all(response.as_bytes());
            }
        });

        format!("http://{}", address)
    }

    fn create_state(binary_path: PathBuf, api_base_url: String) -> AppState {
        let config_path = std::env::temp_dir()
            .join("engram-gui-tests")
            .join(format!("config-{}.json", unique_suffix()));
        let state = AppState::new(Some(config_path));

        state
            .config_store
            .set(EngramConfig {
                binary_path: Some(binary_path.to_string_lossy().to_string()),
                api_base_url,
            })
            .expect("config should be set");

        state
    }

    struct MockProcess {
        pid: u32,
        kill_called: u32,
        exited_before_kill: bool,
        exited_after_kill: bool,
    }

    impl MockProcess {
        fn never_exits() -> Self {
            Self {
                pid: 7,
                kill_called: 0,
                exited_before_kill: false,
                exited_after_kill: false,
            }
        }

        fn exits_after_kill() -> Self {
            Self {
                pid: 8,
                kill_called: 0,
                exited_before_kill: false,
                exited_after_kill: true,
            }
        }
    }

    impl ManagedProcess for MockProcess {
        fn id(&self) -> u32 {
            self.pid
        }

        fn try_wait_exited(&mut self) -> Result<bool, String> {
            if self.kill_called == 0 {
                return Ok(self.exited_before_kill);
            }

            Ok(self.exited_after_kill)
        }

        fn kill_force(&mut self) -> Result<(), String> {
            self.kill_called += 1;
            Ok(())
        }
    }

    #[test]
    fn start_is_idempotent_when_runtime_is_already_running() {
        let binary_path = write_runtime_script();
        let api_base_url = start_health_server();
        let state = create_state(binary_path, api_base_url);

        let first = start(&state).expect("first start should work");
        let second = start(&state).expect("second start should be idempotent");

        assert_eq!(first.process_state, RuntimeProcessState::Running);
        assert_eq!(second.process_state, RuntimeProcessState::Running);
        assert_eq!(first.managed_pid, second.managed_pid);

        let stopped = stop(&state).expect("stop should work");
        assert_eq!(stopped.process_state, RuntimeProcessState::Idle);
        assert!(stopped.managed_pid.is_none());
    }

    #[test]
    fn restart_stops_previous_process_before_starting_new_one() {
        let binary_path = write_runtime_script();
        let api_base_url = start_health_server();
        let state = create_state(binary_path, api_base_url);

        let first = start(&state).expect("initial start should work");
        let restarted = restart(&state).expect("restart should work");

        assert_eq!(first.process_state, RuntimeProcessState::Running);
        assert_eq!(restarted.process_state, RuntimeProcessState::Running);
        assert_ne!(first.managed_pid, restarted.managed_pid);

        let stopped = stop(&state).expect("stop should work");
        assert_eq!(stopped.process_state, RuntimeProcessState::Idle);
    }

    #[test]
    fn stop_timeout_policy_escalates_to_kill_before_succeeding() {
        let mut process = MockProcess::exits_after_kill();

        let result = terminate_process_with_policy(
            &mut process,
            StopPolicy {
                graceful_timeout: Duration::from_millis(0),
                kill_wait_timeout: Duration::from_millis(1),
                poll_interval: Duration::from_millis(0),
            },
        );

        assert!(result.is_ok());
        assert_eq!(process.kill_called, 1);
    }

    #[test]
    fn stop_timeout_policy_returns_timeout_when_process_never_exits_after_kill() {
        let mut process = MockProcess::never_exits();

        let result = terminate_process_with_policy(
            &mut process,
            StopPolicy {
                graceful_timeout: Duration::from_millis(0),
                kill_wait_timeout: Duration::from_millis(0),
                poll_interval: Duration::from_millis(0),
            },
        )
        .expect_err("stop should surface timeout after kill escalation");

        assert_eq!(result.code(), "STOP_TIMEOUT");
        assert_eq!(process.kill_called, 1);
    }

    #[test]
    fn start_stays_starting_until_health_succeeds_then_transitions_to_running() {
        let binary_path = write_runtime_script();
        let api_base_url = start_delayed_health_server(Duration::from_millis(250));
        let state = Arc::new(create_state(binary_path, api_base_url));

        let state_for_start = Arc::clone(&state);
        let handle = std::thread::spawn(move || start(&state_for_start));

        std::thread::sleep(Duration::from_millis(50));

        {
            let runtime = state.runtime.lock().expect("runtime lock poisoned");
            assert_eq!(runtime.process_state, RuntimeProcessState::Starting);
            assert!(runtime.managed_pid.is_some());
        }

        let started = handle
            .join()
            .expect("start thread should join")
            .expect("start should succeed after delayed health response");
        assert_eq!(started.process_state, RuntimeProcessState::Running);

        let stopped = stop(&state).expect("stop should work after successful start");
        assert_eq!(stopped.process_state, RuntimeProcessState::Idle);
    }

    #[test]
    fn start_timeout_keeps_starting_until_timeout_then_marks_error_and_clears_pid() {
        let binary_path = write_runtime_script();
        let state = Arc::new(create_state(binary_path, "http://127.0.0.1:9".to_string()));

        let state_for_start = Arc::clone(&state);
        let handle = std::thread::spawn(move || start(&state_for_start));

        std::thread::sleep(Duration::from_millis(50));

        {
            let runtime = state.runtime.lock().expect("runtime lock poisoned");
            assert_eq!(runtime.process_state, RuntimeProcessState::Starting);
            assert!(runtime.managed_pid.is_some());
        }

        let error = handle
            .join()
            .expect("start thread should join")
            .expect_err("start should timeout when health endpoint is unreachable");

        assert_eq!(error.code, "START_HEALTH_TIMEOUT");

        let runtime = state.runtime.lock().expect("runtime lock poisoned");
        assert_eq!(runtime.process_state, RuntimeProcessState::Error);
        assert_eq!(
            runtime.failure_reason.as_deref(),
            Some("START_HEALTH_TIMEOUT")
        );
        assert!(runtime.managed_pid.is_none());
    }
}
