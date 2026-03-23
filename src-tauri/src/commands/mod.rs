use tauri::State;

use crate::{
    contracts::{AppBootstrapInfo, HealthCheck},
    state::AppState,
};

#[tauri::command]
pub fn health_check(state: State<'_, AppState>) -> HealthCheck {
    HealthCheck {
        status: "ready".to_string(),
        runtime: "tauri".to_string(),
        app_version: state.app_version().to_string(),
    }
}

#[tauri::command]
pub fn get_bootstrap_state(state: State<'_, AppState>) -> AppBootstrapInfo {
    state.bootstrap_info()
}

