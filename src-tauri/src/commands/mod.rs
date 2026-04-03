pub mod config;
pub mod proxy;
pub mod restart;
pub mod start;
pub mod status;
pub mod stop;

use serde::Serialize;

use crate::engram_runtime::{binary::detect_engram_binary, AppState};

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct LifecycleCommandError {
    pub code: &'static str,
    pub message: String,
}

pub fn ensure_binary_available(state: &AppState) -> Result<(), LifecycleCommandError> {
    let config = state.config_store.get();
    let detection = detect_engram_binary(&config);

    if detection.available {
        return Ok(());
    }

    Err(LifecycleCommandError {
        code: "BINARY_UNAVAILABLE",
        message: "Engram binary is missing. Configure binary_path before lifecycle actions."
            .to_string(),
    })
}

#[cfg(test)]
pub(super) fn registered_commands_manifest() -> [&'static str; 8] {
    [
        "check_engram_status",
        "start_engram",
        "stop_engram",
        "restart_engram",
        "get_engram_config",
        "set_engram_config",
        "detect_engram_binary",
        "proxy_engram_get",
    ]
}

#[cfg(test)]
mod tests {
    use std::collections::HashSet;

    use super::registered_commands_manifest;

    #[test]
    fn register_command_manifest_contains_runtime_and_config_commands() {
        let registered_commands = registered_commands_manifest();

        assert_eq!(registered_commands.len(), 8);
        assert!(registered_commands.contains(&"check_engram_status"));
        assert!(registered_commands.contains(&"set_engram_config"));
        assert!(!registered_commands.contains(&"get_engram_logs"));
    }

    #[test]
    fn register_command_manifest_has_unique_entries() {
        let registered_commands = registered_commands_manifest();
        let unique_commands: HashSet<&str> = registered_commands.into_iter().collect();

        assert_eq!(unique_commands.len(), 8);
    }
}
