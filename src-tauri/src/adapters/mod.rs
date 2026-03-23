mod mysql;
mod postgres;

use crate::contracts::{
    CancellationProbeRequest, CancellationProbeResult, ConnectionTestRequest,
    ConnectionTestResult, DatabaseEngine, MetadataFetchRequest, MetadataFetchResult,
    QueryExecutionResult, SqlExecutionRequest,
};

pub fn normalization_note() -> &'static str {
    "adapter layer initialized for PostgreSQL/MySQL normalization"
}

pub async fn test_connection(
    request: ConnectionTestRequest,
) -> Result<ConnectionTestResult, String> {
    match request.profile.engine {
        DatabaseEngine::PostgreSql => postgres::test_connection(request).await,
        DatabaseEngine::MySql => mysql::test_connection(request).await,
    }
}

pub async fn fetch_metadata(
    request: MetadataFetchRequest,
) -> Result<MetadataFetchResult, String> {
    match request.profile.engine {
        DatabaseEngine::PostgreSql => postgres::fetch_metadata(request).await,
        DatabaseEngine::MySql => mysql::fetch_metadata(request).await,
    }
}

pub async fn execute_sql(
    request: SqlExecutionRequest,
) -> Result<QueryExecutionResult, String> {
    match request.profile.engine {
        DatabaseEngine::PostgreSql => postgres::execute_sql(request).await,
        DatabaseEngine::MySql => mysql::execute_sql(request).await,
    }
}

pub async fn run_cancellation_probe(
    request: CancellationProbeRequest,
) -> Result<CancellationProbeResult, String> {
    match request.profile.engine {
        DatabaseEngine::PostgreSql => postgres::run_cancellation_probe(request).await,
        DatabaseEngine::MySql => mysql::run_cancellation_probe(request).await,
    }
}
