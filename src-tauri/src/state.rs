use crate::{
    adapters, persistence, runtime,
    contracts::{
        AppBootstrapInfo, CapabilityMap, ConnectionProfile, DatabaseEngine, MetadataKind,
        MetadataObject, MetadataSnapshot, QueryJob, QueryJobState, SessionContext, TlsMode,
    },
};

#[derive(Debug, Clone)]
pub struct AppState {
    app_version: String,
}

impl AppState {
    pub fn new(app_version: impl Into<String>) -> Self {
        Self {
            app_version: app_version.into(),
        }
    }

    pub fn app_version(&self) -> &str {
        &self.app_version
    }

    pub fn bootstrap_info(&self) -> AppBootstrapInfo {
        AppBootstrapInfo {
            product_name: "DataHelm".to_string(),
            shell_status: "m0-bootstrap-ready".to_string(),
            workspace_folders: vec![
                "src".to_string(),
                "src-tauri".to_string(),
                "spikes".to_string(),
                "docs".to_string(),
            ],
            modules: vec![
                "presentation".to_string(),
                "api-bridge".to_string(),
                "runtime".to_string(),
                "adapters".to_string(),
                "persistence".to_string(),
            ],
            recommended_next_tickets: vec![
                "SP1-01".to_string(),
                "SP1-02".to_string(),
                "SP3-01".to_string(),
            ],
            sample_profile: ConnectionProfile {
                name: "Local PostgreSQL".to_string(),
                engine: DatabaseEngine::PostgreSql,
                host: "127.0.0.1".to_string(),
                port: 5432,
                username: "postgres".to_string(),
                default_database: Some("postgres".to_string()),
                environment_label: Some("local".to_string()),
                read_only: true,
                tls_mode: TlsMode::Prefer,
            },
            sample_session: SessionContext {
                session_id: "bootstrap-session".to_string(),
                profile_name: "Local PostgreSQL".to_string(),
                engine: DatabaseEngine::PostgreSql,
                database: Some("postgres".to_string()),
                environment_label: Some("local".to_string()),
                is_read_only: true,
                capability_map: CapabilityMap {
                    engine: DatabaseEngine::PostgreSql,
                    can_list_schemas: true,
                    can_cancel_query: true,
                    can_read_process_list: true,
                    can_use_keychain: true,
                    notes: vec![
                        runtime::session_supervisor_note().to_string(),
                        adapters::normalization_note().to_string(),
                        persistence::storage_note().to_string(),
                    ],
                },
            },
            sample_query_job: QueryJob {
                job_id: "bootstrap-job".to_string(),
                state: QueryJobState::Idle,
                submitted_sql: None,
            },
            sample_metadata: MetadataSnapshot {
                explorer: vec![
                    MetadataObject {
                        kind: MetadataKind::Database,
                        name: "postgres".to_string(),
                        database: None,
                        schema: None,
                    },
                    MetadataObject {
                        kind: MetadataKind::Schema,
                        name: "public".to_string(),
                        database: Some("postgres".to_string()),
                        schema: None,
                    },
                    MetadataObject {
                        kind: MetadataKind::Table,
                        name: "users".to_string(),
                        database: Some("postgres".to_string()),
                        schema: Some("public".to_string()),
                    },
                ],
                detail_target: Some(MetadataObject {
                    kind: MetadataKind::Table,
                    name: "users".to_string(),
                    database: Some("postgres".to_string()),
                    schema: Some("public".to_string()),
                }),
            },
        }
    }
}

