use serde::Serialize;
use std::path::{Path, PathBuf};

use super::config::EngramConfig;

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct BinaryDetection {
    pub configured_path: Option<String>,
    pub detected_path: Option<String>,
    pub available: bool,
}

pub fn detect_engram_binary(config: &EngramConfig) -> BinaryDetection {
    let configured = config.binary_path.clone();
    let detected = configured
        .as_deref()
        .filter(|path| is_valid_binary_path(path))
        .map(ToString::to_string)
        .or_else(resolve_from_path);

    BinaryDetection {
        configured_path: configured,
        available: detected.is_some(),
        detected_path: detected,
    }
}

pub(crate) fn is_valid_binary_path(path: &str) -> bool {
    let path = Path::new(path);

    if !path.is_file() {
        return false;
    }

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;

        return std::fs::metadata(path)
            .map(|metadata| metadata.permissions().mode() & 0o111 != 0)
            .unwrap_or(false);
    }

    #[cfg(not(unix))]
    {
        true
    }
}

pub(crate) fn resolve_from_path() -> Option<String> {
    let path = std::env::var_os("PATH")?;

    std::env::split_paths(&path)
        .find_map(|directory| find_executable_candidate(directory))
        .map(|path| path.to_string_lossy().to_string())
}

fn find_executable_candidate(directory: PathBuf) -> Option<PathBuf> {
    #[cfg(windows)]
    {
        let pathext = std::env::var_os("PATHEXT")
            .unwrap_or_else(|| ".EXE;.CMD;.BAT;.COM".into())
            .to_string_lossy()
            .to_string();

        for extension in pathext.split(';').filter(|value| !value.is_empty()) {
            let candidate = directory.join(format!("engram{}", extension.to_ascii_lowercase()));
            if is_valid_binary_path(candidate.to_string_lossy().as_ref()) {
                return Some(candidate);
            }
        }

        None
    }

    #[cfg(not(windows))]
    {
        let candidate = directory.join("engram");
        is_valid_binary_path(candidate.to_string_lossy().as_ref()).then_some(candidate)
    }
}

#[cfg(test)]
mod tests {
    use std::{
        sync::Mutex,
        time::{SystemTime, UNIX_EPOCH},
    };

    use super::{detect_engram_binary, resolve_from_path};
    use crate::engram_runtime::config::EngramConfig;

    static PATH_ENV_GUARD: Mutex<()> = Mutex::new(());

    fn unique_temp_file_path() -> std::path::PathBuf {
        let suffix = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("time went backwards")
            .as_nanos();

        std::env::temp_dir()
            .join("engram-gui-tests")
            .join(format!("binary-{suffix}"))
    }

    fn make_executable(path: &std::path::Path) {
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;

            let mut permissions = std::fs::metadata(path)
                .expect("metadata should be readable")
                .permissions();
            permissions.set_mode(0o755);
            std::fs::set_permissions(path, permissions)
                .expect("temporary binary should become executable");
        }
    }

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

    #[test]
    fn reports_available_when_configured_binary_exists() {
        let binary_path = unique_temp_file_path();
        std::fs::create_dir_all(
            binary_path
                .parent()
                .expect("binary path should have parent"),
        )
        .expect("parent directory should be created");
        std::fs::write(&binary_path, "#!/bin/sh").expect("binary placeholder should be written");
        make_executable(&binary_path);

        let config = EngramConfig {
            binary_path: Some(binary_path.to_string_lossy().to_string()),
            api_base_url: "http://127.0.0.1:7437".to_string(),
        };

        let detection = detect_engram_binary(&config);

        assert!(detection.available);
        assert_eq!(detection.detected_path, config.binary_path);
    }

    #[test]
    fn reports_unavailable_when_binary_is_missing() {
        let empty_path_dir = std::env::temp_dir().join("engram-gui-tests").join(format!(
            "missing-binary-empty-path-{}",
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .expect("time ok")
                .as_nanos()
        ));
        std::fs::create_dir_all(&empty_path_dir).expect("empty path dir should exist");

        let config = EngramConfig {
            binary_path: Some("/tmp/definitely-not-present-engramd".to_string()),
            api_base_url: "http://127.0.0.1:7437".to_string(),
        };

        let detection = with_path_env(std::slice::from_ref(&empty_path_dir), || {
            detect_engram_binary(&config)
        });

        assert!(!detection.available);
        assert!(detection.detected_path.is_none());
    }

    #[test]
    fn resolves_from_path_when_configured_binary_is_missing() {
        let bin_dir = std::env::temp_dir().join("engram-gui-tests").join(format!(
            "bin-{}",
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .expect("time ok")
                .as_nanos()
        ));
        std::fs::create_dir_all(&bin_dir).expect("bin dir should exist");

        #[cfg(windows)]
        let binary_name = "engram.exe";
        #[cfg(not(windows))]
        let binary_name = "engram";

        let binary_path = bin_dir.join(binary_name);
        std::fs::write(&binary_path, "#!/bin/sh\nexit 0\n").expect("path binary should be written");
        make_executable(&binary_path);

        let config = EngramConfig {
            binary_path: Some("/tmp/definitely-invalid-engram".to_string()),
            api_base_url: "http://127.0.0.1:7437".to_string(),
        };

        let detection = with_path_env(std::slice::from_ref(&bin_dir), || {
            detect_engram_binary(&config)
        });

        assert!(detection.available);
        assert_eq!(
            detection.detected_path,
            Some(binary_path.to_string_lossy().to_string())
        );
    }

    #[test]
    fn keeps_valid_configured_binary_even_when_path_contains_another_candidate() {
        let configured_binary = unique_temp_file_path();
        std::fs::create_dir_all(
            configured_binary
                .parent()
                .expect("configured binary should have parent"),
        )
        .expect("configured parent should be created");
        std::fs::write(&configured_binary, "#!/bin/sh\nexit 0\n")
            .expect("configured binary should be written");
        make_executable(&configured_binary);

        let path_dir = std::env::temp_dir().join("engram-gui-tests").join(format!(
            "path-bin-{}",
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .expect("time ok")
                .as_nanos()
        ));
        std::fs::create_dir_all(&path_dir).expect("path dir should exist");

        #[cfg(windows)]
        let binary_name = "engram.exe";
        #[cfg(not(windows))]
        let binary_name = "engram";

        let path_candidate = path_dir.join(binary_name);
        std::fs::write(&path_candidate, "#!/bin/sh\nexit 0\n")
            .expect("path candidate should be written");
        make_executable(&path_candidate);

        let config = EngramConfig {
            binary_path: Some(configured_binary.to_string_lossy().to_string()),
            api_base_url: "http://127.0.0.1:7437".to_string(),
        };

        let detection = with_path_env(std::slice::from_ref(&path_dir), || {
            detect_engram_binary(&config)
        });

        assert!(detection.available);
        assert_eq!(
            detection.detected_path,
            Some(configured_binary.to_string_lossy().to_string())
        );
    }

    #[test]
    fn resolve_from_path_returns_none_when_path_has_no_engram_binary() {
        let empty_path_dir = std::env::temp_dir().join("engram-gui-tests").join(format!(
            "empty-path-{}",
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .expect("time ok")
                .as_nanos()
        ));
        std::fs::create_dir_all(&empty_path_dir).expect("empty path dir should exist");

        let detected = with_path_env(std::slice::from_ref(&empty_path_dir), resolve_from_path);

        assert!(detected.is_none());
    }
}
