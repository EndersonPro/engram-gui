use crate::{
    commands::{ensure_binary_available, status::RuntimeStatusPayload, LifecycleCommandError},
    engram_runtime::{supervisor, AppState},
};

use super::status::compose_runtime_status;

#[tauri::command]
pub fn restart_engram(
    state: tauri::State<AppState>,
) -> Result<RuntimeStatusPayload, LifecycleCommandError> {
    ensure_binary_available(&state)?;

    let runtime = supervisor::restart(&state)?;

    Ok(compose_runtime_status(true, runtime))
}
