use tauri::State;

use crate::{
    adapters,
    contracts::{
        AppBootstrapInfo, CancellationProbeRequest, CancellationProbeResult,
        ConnectionTestRequest, ConnectionTestResult, EditorDraftEntry, HealthCheck,
        MetadataFetchRequest, MetadataFetchResult, QueryExecutionResult,
        SaveConnectionProfileRequest, SaveEditorDraftRequest, SavedConnectionProfile,
        SqlExecutionRequest,
    },
    persistence, safety, secret_store,
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
    let resolved_request = resolve_sql_request(&state, request)?;
    if let Err(block) = safety::classify_sql_for_execution(
        &resolved_request.sql,
        resolved_request.profile.read_only,
    ) {
        let metadata = serde_json::json!({
            "classification": block.classification,
            "profileName": resolved_request.profile.name,
            "engine": engine_name(&resolved_request.profile.engine),
        });
        let session_id = format!(
            "{}-{}-{}",
            engine_name(&resolved_request.profile.engine),
            resolved_request.profile.host,
            resolved_request.profile.port
        );
        let _ = persistence::append_action_log(
            &state.local_store().db_path,
            Some(&session_id),
            "read_only_block",
            "blocked",
            &metadata.to_string(),
        );
        return Err(block.reason);
    }

    adapters::execute_sql(resolved_request).await
}

#[tauri::command]
pub fn save_editor_draft(
    state: State<'_, AppState>,
    request: SaveEditorDraftRequest,
) -> Result<EditorDraftEntry, String> {
    persistence::save_editor_draft(&state.local_store().db_path, request)
}

#[tauri::command]
pub fn load_editor_draft(
    state: State<'_, AppState>,
    workspace_key: String,
) -> Result<Option<EditorDraftEntry>, String> {
    persistence::load_editor_draft(&state.local_store().db_path, &workspace_key)
}

#[tauri::command]
pub async fn run_cancellation_probe(
    state: State<'_, AppState>,
    request: CancellationProbeRequest,
) -> Result<CancellationProbeResult, String> {
    adapters::run_cancellation_probe(resolve_cancellation_request(&state, request)?).await
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

fn resolve_cancellation_request(
    _state: &State<'_, AppState>,
    mut request: CancellationProbeRequest,
) -> Result<CancellationProbeRequest, String> {
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
