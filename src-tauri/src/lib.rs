mod adapters;
mod commands;
mod contracts;
mod persistence;
mod runtime;
mod secret_store;
mod safety;
mod state;

use state::AppState;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let local_store_dir = app
                .path()
                .app_local_data_dir()
                .map_err(|error| error.to_string())?;
            let local_store = persistence::init_local_store(&local_store_dir)
                .map_err(|error| error.to_string())?;

            app.manage(AppState::new(env!("CARGO_PKG_VERSION"), local_store));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::health_check,
            commands::get_bootstrap_state,
            commands::test_connection,
            commands::fetch_metadata,
            commands::save_connection_profile,
            commands::list_connection_profiles,
            commands::execute_sql,
            commands::save_editor_draft,
            commands::load_editor_draft,
            commands::run_cancellation_probe
        ])
        .run(tauri::generate_context!())
        .expect("failed to run DataHelm application");
}
