use serde::Serialize;

use crate::engram_runtime::{
    binary::detect_engram_binary, binary::BinaryDetection, config::is_valid_configured_binary_path,
    AppState, HealthMetadata, RuntimeSnapshot,
};

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum RuntimeProcessState {
    Unavailable,
    Idle,
    Starting,
    Running,
    // Kept for Rust↔TS contract parity (`"error"`) while runtime transitions remain hygiene-only.
    #[allow(dead_code)]
    Error,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeStatusPayload {
    pub binary_available: bool,
    pub process_state: RuntimeProcessState,
    pub health: Option<HealthMetadata>,
    pub failure_reason: Option<String>,
}

pub fn compose_runtime_status(
    binary_available: bool,
    runtime: RuntimeSnapshot,
) -> RuntimeStatusPayload {
    let process_state = resolve_process_state(binary_available, runtime.process_state);

    RuntimeStatusPayload {
        binary_available,
        process_state,
        health: runtime.last_health,
        failure_reason: runtime.failure_reason,
    }
}

fn resolve_process_state(
    binary_available: bool,
    runtime_process_state: RuntimeProcessState,
) -> RuntimeProcessState {
    if binary_available {
        runtime_process_state
    } else {
        RuntimeProcessState::Unavailable
    }
}

#[tauri::command]
pub fn check_engram_status(state: tauri::State<AppState>) -> RuntimeStatusPayload {
    let config = state.config_store.get();
    let detection = detect_engram_binary(&config);
    let _ = maybe_bootstrap_binary_path(&state, &detection);
    let runtime = state.runtime.lock().expect("runtime lock poisoned").clone();

    compose_runtime_status(detection.available, runtime)
}

fn maybe_bootstrap_binary_path(
    state: &AppState,
    detection: &BinaryDetection,
) -> Result<(), String> {
    if !detection.available {
        return Ok(());
    }

    let config = state.config_store.get();
    if is_valid_configured_binary_path(config.binary_path.as_deref()) {
        return Ok(());
    }

    let Some(detected_path) = detection.detected_path.clone() else {
        return Ok(());
    };

    state
        .config_store
        .set_binary_path_preserving_api_base_url(detected_path)
        .map(|_| ())
}

#[cfg(test)]
mod tests {
    use std::{
        sync::Mutex,
        time::{SystemTime, UNIX_EPOCH},
    };

    use super::{
        compose_runtime_status, maybe_bootstrap_binary_path, resolve_process_state,
        RuntimeProcessState,
    };
    use crate::commands::ensure_binary_available;
    use crate::engram_runtime::{
        binary::detect_engram_binary, config::EngramConfig, AppState, HealthMetadata,
        RuntimeSnapshot,
    };

    static PATH_ENV_GUARD: Mutex<()> = Mutex::new(());

    fn with_path_env<T>(entries: &[std::path::PathBuf], run: impl FnOnce() -> T) -> T {
        let _guard = PATH_ENV_GUARD.lock().expect("path env guard lock poisoned");
        let original_path = std::env::var_os("PATH");

        let joined = std::env::join_paths(entries)
            .expect("path entries should join")
            .into_string()
            .expect("path should be utf8");

        unsafe {
            std::env::set_var("PATH", joined);
        }

        let output = run();

        match original_path {
            Some(value) => unsafe { std::env::set_var("PATH", value) },
            None => unsafe { std::env::remove_var("PATH") },
        }

        output
    }

    fn unique_suffix() -> u128 {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("time went backwards")
            .as_nanos()
    }

    fn make_executable(path: &std::path::Path) {
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;

            let mut permissions = std::fs::metadata(path)
                .expect("metadata should be readable")
                .permissions();
            permissions.set_mode(0o755);
            std::fs::set_permissions(path, permissions).expect("binary should be executable");
        }
    }

    fn create_state_with_config(config: EngramConfig) -> AppState {
        let config_path = std::env::temp_dir()
            .join("engram-gui-tests")
            .join(format!("status-config-{}.json", unique_suffix()));
        let state = AppState::new(Some(config_path));
        state
            .config_store
            .set(config)
            .expect("config should persist");
        state
    }

    fn write_path_binary() -> (std::path::PathBuf, std::path::PathBuf) {
        let bin_dir = std::env::temp_dir()
            .join("engram-gui-tests")
            .join(format!("status-bin-{}", unique_suffix()));
        std::fs::create_dir_all(&bin_dir).expect("bin dir should exist");

        #[cfg(windows)]
        let binary_name = "engram.exe";
        #[cfg(not(windows))]
        let binary_name = "engram";

        let binary_path = bin_dir.join(binary_name);
        std::fs::write(&binary_path, "#!/bin/sh\nexit 0\n").expect("path binary should be written");
        make_executable(&binary_path);

        (bin_dir, binary_path)
    }

    #[test]
    fn marks_process_as_unavailable_when_binary_is_missing() {
        let runtime = RuntimeSnapshot {
            process_state: RuntimeProcessState::Running,
            managed_pid: None,
            last_health: None,
            failure_reason: None,
        };

        let status = compose_runtime_status(false, runtime);

        assert!(!status.binary_available);
        assert_eq!(status.process_state, RuntimeProcessState::Unavailable);
    }

    #[test]
    fn keeps_runtime_health_when_binary_is_available() {
        let runtime = RuntimeSnapshot {
            process_state: RuntimeProcessState::Running,
            managed_pid: None,
            last_health: Some(HealthMetadata {
                status: "ok".to_string(),
                checked_at: "2026-04-01T00:00:00Z".to_string(),
                version: Some("0.1.0".to_string()),
            }),
            failure_reason: None,
        };

        let status = compose_runtime_status(true, runtime);

        assert!(status.binary_available);
        assert_eq!(status.process_state, RuntimeProcessState::Running);
        assert_eq!(
            status.health.expect("health should be present").status,
            "ok".to_string()
        );
    }

    #[test]
    fn resolve_process_state_returns_runtime_state_when_binary_is_available() {
        let process_state = resolve_process_state(true, RuntimeProcessState::Starting);

        assert_eq!(process_state, RuntimeProcessState::Starting);
    }

    #[test]
    fn resolve_process_state_forces_unavailable_when_binary_is_missing() {
        let process_state = resolve_process_state(false, RuntimeProcessState::Error);

        assert_eq!(process_state, RuntimeProcessState::Unavailable);
    }

    #[test]
    fn runtime_process_state_error_keeps_snake_case_contract_value() {
        let serialized =
            serde_json::to_string(&RuntimeProcessState::Error).expect("serialization should work");

        assert_eq!(serialized, "\"error\"");
    }

    #[test]
    fn bootstrap_heals_missing_binary_path_and_preserves_api_base_url() {
        let (bin_dir, binary_path) = write_path_binary();
        let state = create_state_with_config(EngramConfig {
            binary_path: None,
            api_base_url: "http://127.0.0.1:9001".to_string(),
        });

        with_path_env(std::slice::from_ref(&bin_dir), || {
            let config = state.config_store.get();
            let detection = detect_engram_binary(&config);

            maybe_bootstrap_binary_path(&state, &detection)
                .expect("bootstrap should persist detected binary");
        });

        let healed = state.config_store.get();
        assert_eq!(
            healed.binary_path,
            Some(binary_path.to_string_lossy().to_string())
        );
        assert_eq!(healed.api_base_url, "http://127.0.0.1:9001".to_string());
    }

    #[test]
    fn bootstrap_replaces_invalid_binary_path_from_path_detection() {
        let (bin_dir, binary_path) = write_path_binary();
        let state = create_state_with_config(EngramConfig {
            binary_path: Some("/tmp/definitely-not-valid-engram-binary".to_string()),
            api_base_url: "http://127.0.0.1:7437".to_string(),
        });

        with_path_env(std::slice::from_ref(&bin_dir), || {
            let config = state.config_store.get();
            let detection = detect_engram_binary(&config);

            maybe_bootstrap_binary_path(&state, &detection)
                .expect("bootstrap should update invalid configured path");
        });

        assert_eq!(
            state.config_store.get().binary_path,
            Some(binary_path.to_string_lossy().to_string())
        );
    }

    #[test]
    fn bootstrap_never_overwrites_valid_explicit_binary_path() {
        let explicit_binary = std::env::temp_dir()
            .join("engram-gui-tests")
            .join(format!("status-explicit-{}", unique_suffix()));
        std::fs::create_dir_all(
            explicit_binary
                .parent()
                .expect("explicit binary should have parent"),
        )
        .expect("explicit parent should be created");
        std::fs::write(&explicit_binary, "#!/bin/sh\nexit 0\n")
            .expect("explicit binary should be written");
        make_executable(&explicit_binary);

        let (bin_dir, _) = write_path_binary();
        let state = create_state_with_config(EngramConfig {
            binary_path: Some(explicit_binary.to_string_lossy().to_string()),
            api_base_url: "http://127.0.0.1:7437".to_string(),
        });

        with_path_env(std::slice::from_ref(&bin_dir), || {
            let config = state.config_store.get();
            let detection = detect_engram_binary(&config);

            maybe_bootstrap_binary_path(&state, &detection)
                .expect("bootstrap should not fail on valid explicit path");
        });

        assert_eq!(
            state.config_store.get().binary_path,
            Some(explicit_binary.to_string_lossy().to_string())
        );
    }

    #[test]
    fn bootstrap_keeps_lifecycle_binary_guard_start_restart_compatible() {
        let (bin_dir, _) = write_path_binary();
        let state = create_state_with_config(EngramConfig {
            binary_path: None,
            api_base_url: "http://127.0.0.1:7437".to_string(),
        });

        with_path_env(std::slice::from_ref(&bin_dir), || {
            let config = state.config_store.get();
            let detection = detect_engram_binary(&config);
            maybe_bootstrap_binary_path(&state, &detection)
                .expect("bootstrap should persist binary path for lifecycle commands");
        });

        assert!(ensure_binary_available(&state).is_ok());
    }
}
