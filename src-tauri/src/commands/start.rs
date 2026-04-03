use crate::{
    commands::{ensure_binary_available, status::RuntimeStatusPayload, LifecycleCommandError},
    engram_runtime::{supervisor, AppState},
};

use super::status::compose_runtime_status;

#[tauri::command]
pub fn start_engram(
    state: tauri::State<AppState>,
) -> Result<RuntimeStatusPayload, LifecycleCommandError> {
    ensure_binary_available(&state)?;

    let runtime = supervisor::start(&state)?;

    Ok(compose_runtime_status(true, runtime))
}
