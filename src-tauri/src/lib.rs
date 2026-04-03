mod commands;
mod engram_runtime;

use std::path::PathBuf;

use engram_runtime::AppState;
use tauri::{Manager, WebviewUrl, WebviewWindowBuilder};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let state = AppState::new(resolve_config_path_override());

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(state)
        .setup(|app| {
            let app_handle = app.handle();

            #[cfg(desktop)]
            app_handle.plugin(tauri_plugin_updater::Builder::new().build())?;
            #[cfg(desktop)]
            app_handle.plugin(tauri_plugin_process::init())?;

            if app
                .get_webview_window(default_main_window_label())
                .is_none()
            {
                build_main_window(&app_handle)?;
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::status::check_engram_status,
            commands::start::start_engram,
            commands::stop::stop_engram,
            commands::restart::restart_engram,
            commands::config::get_engram_config,
            commands::config::set_engram_config,
            commands::config::detect_engram_binary,
            commands::proxy::proxy_engram_get
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn build_main_window(app: &tauri::AppHandle) -> tauri::Result<()> {
    let (width, height) = default_main_window_dimensions();

    WebviewWindowBuilder::new(app, default_main_window_label(), WebviewUrl::default())
        .title(default_main_window_title())
        .inner_size(width, height)
        .build()?;

    Ok(())
}

fn default_main_window_label() -> &'static str {
    "main"
}

fn default_main_window_dimensions() -> (f64, f64) {
    (980.0, 680.0)
}

fn default_main_window_title() -> &'static str {
    "Engram GUI"
}

fn resolve_config_path_override() -> Option<PathBuf> {
    std::env::var("ENGRAM_GUI_CONFIG_PATH")
        .ok()
        .map(PathBuf::from)
}

#[cfg(test)]
mod tests {
    use super::{
        default_main_window_dimensions, default_main_window_label, default_main_window_title,
        resolve_config_path_override,
    };

    #[test]
    fn config_override_is_none_when_env_not_set() {
        let value = std::env::var("ENGRAM_GUI_CONFIG_PATH");
        if value.is_ok() {
            return;
        }

        assert!(resolve_config_path_override().is_none());
    }

    #[test]
    fn main_window_defaults_match_single_window_contract() {
        assert_eq!(default_main_window_label(), "main");
        assert_eq!(default_main_window_dimensions(), (980.0, 680.0));
        assert_eq!(default_main_window_title(), "Engram GUI");
    }
}
