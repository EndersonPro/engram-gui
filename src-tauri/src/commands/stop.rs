use crate::{
    commands::{status::RuntimeStatusPayload, LifecycleCommandError},
    engram_runtime::{supervisor, AppState},
};

use super::status::compose_runtime_status;

#[tauri::command]
pub fn stop_engram(
    state: tauri::State<AppState>,
) -> Result<RuntimeStatusPayload, LifecycleCommandError> {
    let runtime = supervisor::stop(&state)?;

    Ok(compose_runtime_status(true, runtime))
}
