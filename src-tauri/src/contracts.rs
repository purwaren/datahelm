use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum DatabaseEngine {
    PostgreSql,
    MySql,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum TlsMode {
    Disable,
    Prefer,
    Require,
    VerifyCa,
    VerifyFull,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConnectionProfile {
    pub name: String,
    pub engine: DatabaseEngine,
    pub host: String,
    pub port: u16,
    pub username: String,
    pub default_database: Option<String>,
    pub environment_label: Option<String>,
    pub read_only: bool,
    pub tls_mode: TlsMode,
    pub secret_ref: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CapabilityMap {
    pub engine: DatabaseEngine,
    pub can_list_schemas: bool,
    pub can_cancel_query: bool,
    pub can_read_process_list: bool,
    pub can_use_keychain: bool,
    pub notes: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionContext {
    pub session_id: String,
    pub profile_name: String,
    pub engine: DatabaseEngine,
    pub database: Option<String>,
    pub environment_label: Option<String>,
    pub is_read_only: bool,
    pub capability_map: CapabilityMap,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum MetadataKind {
    Database,
    Schema,
    Table,
    View,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MetadataObject {
    pub kind: MetadataKind,
    pub name: String,
    pub database: Option<String>,
    pub schema: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MetadataSnapshot {
    pub explorer: Vec<MetadataObject>,
    pub detail_target: Option<MetadataObject>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MetadataColumn {
    pub name: String,
    pub data_type: String,
    pub nullable: bool,
    pub default_value: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MetadataDetail {
    pub target: MetadataObject,
    pub columns: Vec<MetadataColumn>,
    pub notes: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum QueryJobState {
    Idle,
    Running,
    Succeeded,
    Failed,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QueryJob {
    pub job_id: String,
    pub state: QueryJobState,
    pub submitted_sql: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QueryResultColumn {
    pub name: String,
    pub data_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LocalStoreStatus {
    pub db_path: String,
    pub schema_version: u32,
    pub initialized_entities: Vec<String>,
    pub keychain_service: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConnectionTestRequest {
    pub profile: ConnectionProfile,
    pub password: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveConnectionProfileRequest {
    pub profile: ConnectionProfile,
    pub password: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SavedConnectionProfile {
    pub profile: ConnectionProfile,
    pub has_secret: bool,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConnectionTestResult {
    pub success: bool,
    pub engine: DatabaseEngine,
    pub latency_ms: u64,
    pub server_version: Option<String>,
    pub database_name: Option<String>,
    pub notes: Vec<String>,
    pub session: SessionContext,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MetadataFetchRequest {
    pub profile: ConnectionProfile,
    pub password: Option<String>,
    pub target: Option<MetadataObject>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MetadataFetchResult {
    pub engine: DatabaseEngine,
    pub explorer: Vec<MetadataObject>,
    pub detail: Option<MetadataDetail>,
    pub notes: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SqlExecutionRequest {
    pub profile: ConnectionProfile,
    pub password: Option<String>,
    pub sql: String,
    pub row_limit: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QueryExecutionResult {
    pub engine: DatabaseEngine,
    pub job: QueryJob,
    pub columns: Vec<QueryResultColumn>,
    pub rows: Vec<Vec<String>>,
    pub row_count: usize,
    pub affected_rows: Option<u64>,
    pub notices: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HealthCheck {
    pub status: String,
    pub runtime: String,
    pub app_version: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppBootstrapInfo {
    pub product_name: String,
    pub shell_status: String,
    pub workspace_folders: Vec<String>,
    pub modules: Vec<String>,
    pub recommended_next_tickets: Vec<String>,
    pub local_store: LocalStoreStatus,
    pub sample_profile: ConnectionProfile,
    pub sample_session: SessionContext,
    pub sample_query_job: QueryJob,
    pub sample_metadata: MetadataSnapshot,
}
