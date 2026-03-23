use tauri::State;

use crate::{
    adapters,
    contracts::{
        AppBootstrapInfo, ConnectionTestRequest, ConnectionTestResult, HealthCheck,
        MetadataFetchRequest, MetadataFetchResult, SaveConnectionProfileRequest,
        SavedConnectionProfile, SqlExecutionRequest, QueryExecutionResult,
    },
    persistence, secret_store,
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

#[tauri::command]
pub async fn test_connection(
    state: State<'_, AppState>,
    request: ConnectionTestRequest,
) -> Result<ConnectionTestResult, String> {
    adapters::test_connection(resolve_test_request(&state, request)?).await
}

#[tauri::command]
pub async fn fetch_metadata(
    state: State<'_, AppState>,
    request: MetadataFetchRequest,
) -> Result<MetadataFetchResult, String> {
    adapters::fetch_metadata(resolve_metadata_request(&state, request)?).await
}

#[tauri::command]
pub fn save_connection_profile(
    state: State<'_, AppState>,
    request: SaveConnectionProfileRequest,
) -> Result<SavedConnectionProfile, String> {
    let mut profile = request.profile;

    if let Some(password) = request.password {
        let secret_ref = secret_store::store_secret(
            &profile.name,
            engine_name(&profile.engine),
            &password,
        )?;
        profile.secret_ref = Some(secret_ref);
    }

    persistence::save_connection_profile(&state.local_store().db_path, &profile)
}

#[tauri::command]
pub fn list_connection_profiles(
    state: State<'_, AppState>,
) -> Result<Vec<SavedConnectionProfile>, String> {
    persistence::list_connection_profiles(&state.local_store().db_path)
}

#[tauri::command]
pub async fn execute_sql(
    state: State<'_, AppState>,
    request: SqlExecutionRequest,
) -> Result<QueryExecutionResult, String> {
    adapters::execute_sql(resolve_sql_request(&state, request)?).await
}

fn resolve_test_request(
    _state: &State<'_, AppState>,
    mut request: ConnectionTestRequest,
) -> Result<ConnectionTestRequest, String> {
    if request.password.is_none() {
        if let Some(secret_ref) = request.profile.secret_ref.as_deref() {
            request.password = Some(secret_store::resolve_secret(secret_ref)?);
        }
    }

    Ok(request)
}

fn resolve_metadata_request(
    _state: &State<'_, AppState>,
    mut request: MetadataFetchRequest,
) -> Result<MetadataFetchRequest, String> {
    if request.password.is_none() {
        if let Some(secret_ref) = request.profile.secret_ref.as_deref() {
            request.password = Some(secret_store::resolve_secret(secret_ref)?);
        }
    }

    Ok(request)
}

fn resolve_sql_request(
    _state: &State<'_, AppState>,
    mut request: SqlExecutionRequest,
) -> Result<SqlExecutionRequest, String> {
    if request.password.is_none() {
        if let Some(secret_ref) = request.profile.secret_ref.as_deref() {
            request.password = Some(secret_store::resolve_secret(secret_ref)?);
        }
    }

    Ok(request)
}

fn engine_name(engine: &crate::contracts::DatabaseEngine) -> &'static str {
    match engine {
        crate::contracts::DatabaseEngine::PostgreSql => "postgresql",
        crate::contracts::DatabaseEngine::MySql => "mysql",
    }
}
