use std::{
    fs,
    path::{Path, PathBuf},
    sync::RwLock,
};

use serde::{Deserialize, Serialize};

use super::binary::is_valid_binary_path;

pub const DEFAULT_HEALTH_URL: &str = "http://127.0.0.1:7437";

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct EngramConfig {
    pub binary_path: Option<String>,
    #[serde(
        default = "default_api_base_url",
        alias = "health_url",
        alias = "healthUrl"
    )]
    pub api_base_url: String,
}

fn default_api_base_url() -> String {
    DEFAULT_HEALTH_URL.to_string()
}

impl Default for EngramConfig {
    fn default() -> Self {
        Self {
            binary_path: None,
            api_base_url: default_api_base_url(),
        }
    }
}

pub struct ConfigStore {
    path: PathBuf,
    config: RwLock<EngramConfig>,
}

impl ConfigStore {
    pub fn new(path_override: Option<PathBuf>) -> Self {
        let path = path_override.unwrap_or_else(default_config_path);
        let initial = read_config(&path).unwrap_or_default();

        Self {
            path,
            config: RwLock::new(initial),
        }
    }

    pub fn get(&self) -> EngramConfig {
        self.config.read().expect("config lock poisoned").clone()
    }

    pub fn set(&self, next: EngramConfig) -> Result<EngramConfig, String> {
        persist_config(&self.path, &next)?;

        let mut guard = self.config.write().expect("config lock poisoned");
        *guard = next.clone();

        Ok(next)
    }

    pub fn set_binary_path_preserving_api_base_url(
        &self,
        binary_path: String,
    ) -> Result<EngramConfig, String> {
        let mut next = self.get();
        next.binary_path = Some(binary_path);
        self.set(next)
    }
}

pub fn is_valid_configured_binary_path(path: Option<&str>) -> bool {
    path.map(is_valid_binary_path).unwrap_or(false)
}

fn read_config(path: &Path) -> Option<EngramConfig> {
    let raw = fs::read_to_string(path).ok()?;
    serde_json::from_str(&raw).ok()
}

fn persist_config(path: &Path, config: &EngramConfig) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| format!("cannot create config dir: {error}"))?;
    }

    let encoded = serde_json::to_string_pretty(config)
        .map_err(|error| format!("cannot serialize config: {error}"))?;
    fs::write(path, encoded).map_err(|error| format!("cannot persist config: {error}"))
}

fn default_config_path() -> PathBuf {
    let current_dir = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
    current_dir.join(".engram-gui").join("config.json")
}

#[cfg(test)]
mod tests {
    use std::time::{SystemTime, UNIX_EPOCH};

    use super::{is_valid_configured_binary_path, ConfigStore, EngramConfig, DEFAULT_HEALTH_URL};

    fn unique_temp_config_path() -> std::path::PathBuf {
        let suffix = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("time went backwards")
            .as_nanos();

        std::env::temp_dir()
            .join("engram-gui-tests")
            .join(format!("config-{suffix}.json"))
    }

    #[test]
    fn set_persists_and_returns_new_config() {
        let path = unique_temp_config_path();
        let store = ConfigStore::new(Some(path.clone()));

        let updated = EngramConfig {
            binary_path: Some("/tmp/engramd".to_string()),
            api_base_url: "http://127.0.0.1:9000".to_string(),
        };

        let result = store.set(updated.clone());

        assert!(result.is_ok());
        assert_eq!(store.get(), updated);

        let from_disk = std::fs::read_to_string(path).expect("config should exist");
        assert!(from_disk.contains("/tmp/engramd"));
    }

    #[test]
    fn new_reads_existing_config_file() {
        let path = unique_temp_config_path();
        let expected = EngramConfig {
            binary_path: Some("/opt/engram/bin/engramd".to_string()),
            api_base_url: "http://127.0.0.1:7777".to_string(),
        };

        std::fs::create_dir_all(path.parent().expect("temp path should have parent"))
            .expect("parent directory should be created");
        std::fs::write(
            &path,
            serde_json::to_string(&expected).expect("config serialization should work"),
        )
        .expect("config file should be written");

        let store = ConfigStore::new(Some(path));

        assert_eq!(store.get(), expected);
    }

    #[test]
    fn default_health_url_points_to_local_engram_route() {
        let config = EngramConfig::default();

        assert_eq!(config.api_base_url, DEFAULT_HEALTH_URL.to_string());
    }

    #[test]
    fn supports_legacy_health_url_alias_when_loading_config() {
        let path = unique_temp_config_path();

        std::fs::create_dir_all(path.parent().expect("temp path should have parent"))
            .expect("parent directory should be created");
        std::fs::write(
            &path,
            r#"{"binaryPath":null,"healthUrl":"http://127.0.0.1:8555"}"#,
        )
        .expect("legacy config should be written");

        let store = ConfigStore::new(Some(path));

        assert_eq!(
            store.get().api_base_url,
            "http://127.0.0.1:8555".to_string()
        );
    }

    #[test]
    fn can_validate_configured_binary_path_without_mutating_config() {
        let path = unique_temp_config_path();
        std::fs::write(&path, "#!/bin/sh\nexit 0\n").expect("binary file should be written");

        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;

            let mut permissions = std::fs::metadata(&path)
                .expect("metadata should exist")
                .permissions();
            permissions.set_mode(0o755);
            std::fs::set_permissions(&path, permissions).expect("binary should be executable");
        }

        let config = EngramConfig {
            binary_path: Some(path.to_string_lossy().to_string()),
            api_base_url: "http://127.0.0.1:7437".to_string(),
        };

        assert!(is_valid_configured_binary_path(
            config.binary_path.as_deref()
        ));
    }

    #[test]
    fn set_binary_path_preserving_api_base_url_keeps_existing_url() {
        let path = unique_temp_config_path();
        let store = ConfigStore::new(Some(path));
        let initial = EngramConfig {
            binary_path: None,
            api_base_url: "http://127.0.0.1:8111".to_string(),
        };
        store.set(initial).expect("initial config should persist");

        let updated = store
            .set_binary_path_preserving_api_base_url("/tmp/engram-autodetected".to_string())
            .expect("binary path update should work");

        assert_eq!(
            updated.binary_path,
            Some("/tmp/engram-autodetected".to_string())
        );
        assert_eq!(updated.api_base_url, "http://127.0.0.1:8111".to_string());
        assert_eq!(
            store.get().api_base_url,
            "http://127.0.0.1:8111".to_string()
        );
    }
}
