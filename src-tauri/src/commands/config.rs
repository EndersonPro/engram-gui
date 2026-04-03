use serde::{Deserialize, Serialize};

use crate::engram_runtime::{
    binary::detect_engram_binary as detect_binary, config::EngramConfig, AppState,
};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct SetEngramConfigInput {
    pub binary_path: Option<String>,
    #[serde(alias = "health_url", alias = "healthUrl")]
    pub api_base_url: String,
}

impl From<SetEngramConfigInput> for EngramConfig {
    fn from(value: SetEngramConfigInput) -> Self {
        Self {
            binary_path: value.binary_path,
            api_base_url: value.api_base_url,
        }
    }
}

#[tauri::command]
pub fn get_engram_config(state: tauri::State<AppState>) -> EngramConfig {
    state.config_store.get()
}

#[tauri::command]
pub fn set_engram_config(
    state: tauri::State<AppState>,
    input: SetEngramConfigInput,
) -> Result<EngramConfig, String> {
    state.config_store.set(input.into())
}

#[tauri::command]
pub fn detect_engram_binary(
    state: tauri::State<AppState>,
) -> crate::engram_runtime::binary::BinaryDetection {
    let config = state.config_store.get();
    detect_binary(&config)
}

#[cfg(test)]
mod tests {
    use super::SetEngramConfigInput;
    use crate::engram_runtime::config::EngramConfig;

    #[test]
    fn maps_set_input_into_engram_config() {
        let input = SetEngramConfigInput {
            binary_path: Some("/tmp/engramd".to_string()),
            api_base_url: "http://127.0.0.1:9090".to_string(),
        };

        let config: EngramConfig = input.into();

        assert_eq!(config.binary_path, Some("/tmp/engramd".to_string()));
        assert_eq!(config.api_base_url, "http://127.0.0.1:9090".to_string());
    }

    #[test]
    fn preserves_none_binary_path_when_input_does_not_set_it() {
        let input = SetEngramConfigInput {
            binary_path: None,
            api_base_url: "http://127.0.0.1:7437".to_string(),
        };

        let config: EngramConfig = input.into();

        assert!(config.binary_path.is_none());
        assert_eq!(config.api_base_url, "http://127.0.0.1:7437".to_string());
    }
}
