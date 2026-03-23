use std::time::Instant;

use sqlx::{
    postgres::{PgConnectOptions, PgConnection, PgSslMode},
    query, query_scalar, Column, Connection, Executor, Row, TypeInfo,
};

use crate::contracts::{
    CapabilityMap, ConnectionTestRequest, ConnectionTestResult, DatabaseEngine, MetadataColumn,
    MetadataDetail, MetadataFetchRequest, MetadataFetchResult, MetadataKind, MetadataObject,
    QueryExecutionResult, QueryJobState, QueryResultColumn, SessionContext, SqlExecutionRequest,
    TlsMode,
};
use crate::runtime;

pub async fn test_connection(
    request: ConnectionTestRequest,
) -> Result<ConnectionTestResult, String> {
    let started_at = Instant::now();
    let profile = request.profile;

    let mut options = PgConnectOptions::new()
        .host(&profile.host)
        .port(profile.port)
        .username(&profile.username)
        .ssl_mode(map_tls_mode(&profile.tls_mode));

    if let Some(password) = request.password.as_deref() {
        options = options.password(password);
    }

    if let Some(database) = profile.default_database.as_deref() {
        options = options.database(database);
    }

    let mut connection = PgConnection::connect_with(&options)
        .await
        .map_err(format_connect_error)?;

    let server_version = query_scalar::<_, String>("select version()")
        .fetch_one(&mut connection)
        .await
        .ok();
    let database_name = query_scalar::<_, String>("select current_database()")
        .fetch_one(&mut connection)
        .await
        .ok()
        .or(profile.default_database.clone());

    Ok(ConnectionTestResult {
        success: true,
        engine: DatabaseEngine::PostgreSql,
        latency_ms: started_at.elapsed().as_millis() as u64,
        server_version,
        database_name: database_name.clone(),
        notes: vec![
            "postgres connection baseline succeeded".to_string(),
            "schema listing baseline assumed available".to_string(),
        ],
        session: SessionContext {
            session_id: format!("postgresql-{}-{}", profile.host, profile.port),
            profile_name: profile.name,
            engine: DatabaseEngine::PostgreSql,
            database: database_name,
            environment_label: profile.environment_label,
            is_read_only: profile.read_only,
            capability_map: CapabilityMap {
                engine: DatabaseEngine::PostgreSql,
                can_list_schemas: true,
                can_cancel_query: true,
                can_read_process_list: true,
                can_use_keychain: true,
                notes: vec![
                    "postgres adapter path active".to_string(),
                    "metadata normalization pending SP1-03".to_string(),
                ],
            },
        },
    })
}

fn map_tls_mode(mode: &TlsMode) -> PgSslMode {
    match mode {
        TlsMode::Disable => PgSslMode::Disable,
        TlsMode::Prefer => PgSslMode::Prefer,
        TlsMode::Require => PgSslMode::Require,
        TlsMode::VerifyCa => PgSslMode::VerifyCa,
        TlsMode::VerifyFull => PgSslMode::VerifyFull,
    }
}

fn format_connect_error(error: sqlx::Error) -> String {
    format!("PostgreSQL connection failed: {error}")
}

pub async fn fetch_metadata(
    request: MetadataFetchRequest,
) -> Result<MetadataFetchResult, String> {
    let profile = request.profile;

    let mut options = PgConnectOptions::new()
        .host(&profile.host)
        .port(profile.port)
        .username(&profile.username)
        .ssl_mode(map_tls_mode(&profile.tls_mode));

    if let Some(password) = request.password.as_deref() {
        options = options.password(password);
    }

    if let Some(database) = profile.default_database.as_deref() {
        options = options.database(database);
    }

    let mut connection = PgConnection::connect_with(&options)
        .await
        .map_err(format_connect_error)?;

    let current_database = query_scalar::<_, String>("select current_database()")
        .fetch_one(&mut connection)
        .await
        .unwrap_or_else(|_| profile.default_database.clone().unwrap_or_else(|| "postgres".to_string()));

    let database_objects = query(
        "select datname from pg_database where datistemplate = false order by datname limit 20",
    )
    .fetch_all(&mut connection)
    .await
    .map_err(format_connect_error)?
    .into_iter()
    .map(|row| MetadataObject {
        kind: MetadataKind::Database,
        name: row.get::<String, _>("datname"),
        database: None,
        schema: None,
    })
    .collect::<Vec<_>>();

    let schema_objects = query(
        "select schema_name from information_schema.schemata where schema_name not in ('information_schema', 'pg_catalog') order by schema_name limit 30",
    )
    .fetch_all(&mut connection)
    .await
    .map_err(format_connect_error)?
    .into_iter()
    .map(|row| MetadataObject {
        kind: MetadataKind::Schema,
        name: row.get::<String, _>("schema_name"),
        database: Some(current_database.clone()),
        schema: None,
    })
    .collect::<Vec<_>>();

    let mut object_rows = query(
        r#"
        select
            table_schema,
            table_name,
            table_type
        from information_schema.tables
        where table_schema not in ('information_schema', 'pg_catalog')
        order by table_schema, table_name
        limit 80
        "#,
    )
    .fetch_all(&mut connection)
    .await
    .map_err(format_connect_error)?;

    let object_candidates = object_rows
        .drain(..)
        .map(|row| {
            let table_type: String = row.get("table_type");
            MetadataObject {
                kind: if table_type.eq_ignore_ascii_case("VIEW") {
                    MetadataKind::View
                } else {
                    MetadataKind::Table
                },
                name: row.get("table_name"),
                database: Some(current_database.clone()),
                schema: Some(row.get("table_schema")),
            }
        })
        .collect::<Vec<_>>();

    let mut explorer = Vec::new();
    explorer.extend(database_objects);
    explorer.extend(schema_objects);
    explorer.extend(object_candidates.clone());

    let detail_target = request
        .target
        .or_else(|| {
            object_candidates
                .iter()
                .find(|object| matches!(object.kind, MetadataKind::Table | MetadataKind::View))
                .cloned()
        });

    let detail = if let Some(target) = detail_target {
        let schema_name = target
            .schema
            .clone()
            .unwrap_or_else(|| "public".to_string());
        let columns = query(
            r#"
            select
                column_name,
                data_type,
                is_nullable,
                column_default
            from information_schema.columns
            where table_schema = $1 and table_name = $2
            order by ordinal_position
            "#,
        )
        .bind(&schema_name)
        .bind(&target.name)
        .fetch_all(&mut connection)
        .await
        .map_err(format_connect_error)?
        .into_iter()
        .map(|row| MetadataColumn {
            name: row.get("column_name"),
            data_type: row.get("data_type"),
            nullable: row.get::<String, _>("is_nullable") == "YES",
            default_value: row.get("column_default"),
        })
        .collect::<Vec<_>>();

        Some(MetadataDetail {
            target,
            columns,
            notes: vec![
                "postgres metadata normalized".to_string(),
                "constraints and indexes deferred to later spike work".to_string(),
            ],
        })
    } else {
        None
    };

    Ok(MetadataFetchResult {
        engine: DatabaseEngine::PostgreSql,
        explorer,
        detail,
        notes: vec![
            "database, schema, table, and view baseline loaded".to_string(),
            "privilege and constraint metadata not yet included".to_string(),
        ],
    })
}

pub async fn execute_sql(
    request: SqlExecutionRequest,
) -> Result<QueryExecutionResult, String> {
    let SqlExecutionRequest {
        profile,
        password,
        sql,
        row_limit,
    } = request;
    let mut options = PgConnectOptions::new()
        .host(&profile.host)
        .port(profile.port)
        .username(&profile.username)
        .ssl_mode(map_tls_mode(&profile.tls_mode));

    if let Some(password) = password.as_deref() {
        options = options.password(password);
    }

    if let Some(database) = profile.default_database.as_deref() {
        options = options.database(database);
    }

    let mut connection = PgConnection::connect_with(&options)
        .await
        .map_err(format_connect_error)?;

    let statement = sql.trim();
    if statement.is_empty() {
        return Err("SQL execution failed: statement is empty".to_string());
    }

    let describe = connection
        .describe(statement)
        .await
        .map_err(format_connect_error)?;
    let mut job = runtime::new_query_job(statement);

    if returns_rows(statement) {
        let limited_sql = apply_row_limit(statement, row_limit);
        let rows = query(&limited_sql)
            .fetch_all(&mut connection)
            .await
            .map_err(format_connect_error)?;

        let columns = describe
            .columns()
            .iter()
            .map(|column| QueryResultColumn {
                name: column.name().to_string(),
                data_type: column.type_info().name().to_string(),
            })
            .collect::<Vec<_>>();

        let normalized_rows = rows
            .iter()
            .map(|row| {
                (0..columns.len())
                    .map(|index| pg_value_to_string(row, index))
                    .collect::<Vec<_>>()
            })
            .collect::<Vec<_>>();

        job = runtime::complete_query_job(job, QueryJobState::Succeeded);

        Ok(QueryExecutionResult {
            engine: DatabaseEngine::PostgreSql,
            job,
            columns,
            row_count: normalized_rows.len(),
            rows: normalized_rows,
            affected_rows: None,
            notices: vec!["postgres row-returning execution completed".to_string()],
        })
    } else {
        let result = query(statement)
            .execute(&mut connection)
            .await
            .map_err(format_connect_error)?;
        job = runtime::complete_query_job(job, QueryJobState::Succeeded);

        Ok(QueryExecutionResult {
            engine: DatabaseEngine::PostgreSql,
            job,
            columns: Vec::new(),
            rows: Vec::new(),
            row_count: 0,
            affected_rows: Some(result.rows_affected()),
            notices: vec!["postgres statement executed without rowset".to_string()],
        })
    }
}

fn returns_rows(sql: &str) -> bool {
    let normalized = sql.trim_start().to_ascii_lowercase();
    ["select", "with", "show", "explain", "values"]
        .iter()
        .any(|keyword| normalized.starts_with(keyword))
}

fn apply_row_limit(sql: &str, row_limit: Option<u32>) -> String {
    let Some(limit) = row_limit else {
        return sql.to_string();
    };

    let normalized = sql.trim_end().trim_end_matches(';').to_ascii_lowercase();
    if normalized.contains(" limit ") {
        sql.trim_end().trim_end_matches(';').to_string()
    } else {
        format!("{} LIMIT {}", sql.trim_end().trim_end_matches(';'), limit)
    }
}

fn pg_value_to_string(row: &sqlx::postgres::PgRow, index: usize) -> String {
    if let Ok(value) = row.try_get::<Option<String>, _>(index) {
        return value.unwrap_or_else(|| "NULL".to_string());
    }
    if let Ok(value) = row.try_get::<Option<i64>, _>(index) {
        return value.map(|inner| inner.to_string()).unwrap_or_else(|| "NULL".to_string());
    }
    if let Ok(value) = row.try_get::<Option<f64>, _>(index) {
        return value.map(|inner| inner.to_string()).unwrap_or_else(|| "NULL".to_string());
    }
    if let Ok(value) = row.try_get::<Option<bool>, _>(index) {
        return value.map(|inner| inner.to_string()).unwrap_or_else(|| "NULL".to_string());
    }
    if let Ok(value) = row.try_get::<Option<Vec<u8>>, _>(index) {
        return value
            .map(|inner| format!("<{} bytes>", inner.len()))
            .unwrap_or_else(|| "NULL".to_string());
    }

    "<unrenderable>".to_string()
}
