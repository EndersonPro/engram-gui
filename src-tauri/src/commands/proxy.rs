use crate::{
    commands::LifecycleCommandError,
    engram_runtime::{
        proxy::{proxy_get, ProxyRequest, ProxyResponse},
        AppState,
    },
};

#[tauri::command]
pub fn proxy_engram_get(
    state: tauri::State<AppState>,
    request: ProxyRequest,
) -> Result<ProxyResponse, LifecycleCommandError> {
    let config = state.config_store.get();

    proxy_get(&config, &request).map_err(|message| LifecycleCommandError {
        code: "PROXY_TRANSPORT_ERROR",
        message,
    })
}
