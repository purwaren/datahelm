mod adapters;
mod commands;
mod contracts;
mod persistence;
mod runtime;
mod state;

use state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState::new(env!("CARGO_PKG_VERSION")))
        .invoke_handler(tauri::generate_handler![
            commands::health_check,
            commands::get_bootstrap_state
        ])
        .run(tauri::generate_context!())
        .expect("failed to run DataHelm application");
}
