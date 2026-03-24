use std::{
    fs,
    path::{Path, PathBuf},
};

use rusqlite::{params, Connection};

use crate::{
    contracts::{
        ConnectionProfile, DatabaseEngine, EditorDraftEntry, LocalStoreStatus,
        SavedConnectionProfile, SaveEditorDraftRequest, TlsMode,
    },
    secret_store,
};

const INITIAL_SCHEMA_VERSION: u32 = 1;

pub fn storage_note() -> &'static str {
    "persistence layer initialized for SQLite and keychain integration"
}

pub fn init_local_store(base_dir: &Path) -> Result<LocalStoreStatus, String> {
    fs::create_dir_all(base_dir).map_err(|error| error.to_string())?;
    let db_path = base_dir.join("datahelm.db");
    let connection = Connection::open(&db_path).map_err(|error| error.to_string())?;

    connection
        .pragma_update(None, "journal_mode", "WAL")
        .map_err(|error| error.to_string())?;
    connection
        .pragma_update(None, "foreign_keys", "ON")
        .map_err(|error| error.to_string())?;

    migrate(&connection)?;

    let schema_version: u32 = connection
        .query_row("PRAGMA user_version", [], |row| row.get(0))
        .map_err(|error| error.to_string())?;

    Ok(LocalStoreStatus {
        db_path: normalize_path(&db_path),
        schema_version,
        initialized_entities: vec![
            "connection_profiles".to_string(),
            "editor_recovery".to_string(),
            "action_log".to_string(),
        ],
        keychain_service: secret_store::keychain_service_name().to_string(),
    })
}

pub fn save_connection_profile(
    db_path: &str,
    profile: &ConnectionProfile,
) -> Result<SavedConnectionProfile, String> {
    let connection = open_connection(db_path)?;
    connection
        .execute(
            r#"
            INSERT INTO connection_profiles (
                name,
                engine,
                host,
                port,
                username,
                default_database,
                environment_label,
                read_only,
                tls_mode,
                secret_ref,
                updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(name) DO UPDATE SET
                engine = excluded.engine,
                host = excluded.host,
                port = excluded.port,
                username = excluded.username,
                default_database = excluded.default_database,
                environment_label = excluded.environment_label,
                read_only = excluded.read_only,
                tls_mode = excluded.tls_mode,
                secret_ref = excluded.secret_ref,
                updated_at = CURRENT_TIMESTAMP
            "#,
            params![
                profile.name,
                engine_to_str(&profile.engine),
                profile.host,
                profile.port,
                profile.username,
                profile.default_database,
                profile.environment_label,
                if profile.read_only { 1 } else { 0 },
                tls_mode_to_str(&profile.tls_mode),
                profile.secret_ref,
            ],
        )
        .map_err(|error| error.to_string())?;

    find_connection_profile_by_name(&connection, &profile.name)?
        .ok_or_else(|| "Saved profile could not be reloaded".to_string())
}

pub fn list_connection_profiles(db_path: &str) -> Result<Vec<SavedConnectionProfile>, String> {
    let connection = open_connection(db_path)?;
    let mut statement = connection
        .prepare(
            r#"
            SELECT
                name,
                engine,
                host,
                port,
                username,
                default_database,
                environment_label,
                read_only,
                tls_mode,
                secret_ref,
                updated_at
            FROM connection_profiles
            ORDER BY updated_at DESC, name ASC
            "#,
        )
        .map_err(|error| error.to_string())?;

    let rows = statement
        .query_map([], |row| {
            let secret_ref: Option<String> = row.get(9)?;
            Ok(SavedConnectionProfile {
                profile: ConnectionProfile {
                    name: row.get(0)?,
                    engine: engine_from_str(&row.get::<_, String>(1)?)
                        .map_err(to_sql_error)?,
                    host: row.get(2)?,
                    port: row.get(3)?,
                    username: row.get(4)?,
                    default_database: row.get(5)?,
                    environment_label: row.get(6)?,
                    read_only: row.get::<_, i64>(7)? == 1,
                    tls_mode: tls_mode_from_str(&row.get::<_, String>(8)?)
                        .map_err(to_sql_error)?,
                    secret_ref: secret_ref.clone(),
                },
                has_secret: secret_ref.is_some(),
                updated_at: row.get(10)?,
            })
        })
        .map_err(|error| error.to_string())?;

    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())
}

pub fn delete_connection_profile(db_path: &str, profile_name: &str) -> Result<(), String> {
    let connection = open_connection(db_path)?;
    let deleted = connection
        .execute(
            "DELETE FROM connection_profiles WHERE name = ?",
            params![profile_name],
        )
        .map_err(|error| error.to_string())?;

    if deleted == 0 {
        return Err(format!("Connection profile not found: {profile_name}"));
    }

    Ok(())
}

pub fn save_editor_draft(
    db_path: &str,
    request: SaveEditorDraftRequest,
) -> Result<EditorDraftEntry, String> {
    let connection = open_connection(db_path)?;
    connection
        .execute(
            r#"
            INSERT INTO editor_recovery (
                workspace_key,
                engine,
                connection_profile_name,
                database_name,
                sql_text,
                updated_at
            ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(workspace_key) DO UPDATE SET
                engine = excluded.engine,
                connection_profile_name = excluded.connection_profile_name,
                database_name = excluded.database_name,
                sql_text = excluded.sql_text,
                updated_at = CURRENT_TIMESTAMP
            "#,
            params![
                request.workspace_key,
                request.engine.as_ref().map(engine_to_str),
                request.connection_profile_name,
                request.database_name,
                request.sql_text,
            ],
        )
        .map_err(|error| error.to_string())?;

    load_editor_draft(db_path, &request.workspace_key)?
        .ok_or_else(|| "Saved draft could not be reloaded".to_string())
}

pub fn load_editor_draft(
    db_path: &str,
    workspace_key: &str,
) -> Result<Option<EditorDraftEntry>, String> {
    let connection = open_connection(db_path)?;
    let mut statement = connection
        .prepare(
            r#"
            SELECT
                workspace_key,
                engine,
                connection_profile_name,
                database_name,
                sql_text,
                updated_at
            FROM editor_recovery
            WHERE workspace_key = ?
            LIMIT 1
            "#,
        )
        .map_err(|error| error.to_string())?;

    let mut rows = statement
        .query(params![workspace_key])
        .map_err(|error| error.to_string())?;
    let Some(row) = rows.next().map_err(|error| error.to_string())? else {
        return Ok(None);
    };

    let engine_value: Option<String> = row.get(1).map_err(|error| error.to_string())?;

    Ok(Some(EditorDraftEntry {
        workspace_key: row.get(0).map_err(|error| error.to_string())?,
        engine: engine_value.as_deref().map(engine_from_str).transpose()?,
        connection_profile_name: row.get(2).map_err(|error| error.to_string())?,
        database_name: row.get(3).map_err(|error| error.to_string())?,
        sql_text: row.get(4).map_err(|error| error.to_string())?,
        updated_at: row.get(5).map_err(|error| error.to_string())?,
    }))
}

pub fn append_action_log(
    db_path: &str,
    session_id: Option<&str>,
    action_type: &str,
    action_status: &str,
    metadata_json: &str,
) -> Result<(), String> {
    let connection = open_connection(db_path)?;
    connection
        .execute(
            r#"
            INSERT INTO action_log (
                session_id,
                action_type,
                action_status,
                metadata_json
            ) VALUES (?, ?, ?, ?)
            "#,
            params![session_id, action_type, action_status, metadata_json],
        )
        .map_err(|error| error.to_string())?;

    Ok(())
}

fn migrate(connection: &Connection) -> Result<(), String> {
    let current_version: u32 = connection
        .query_row("PRAGMA user_version", [], |row| row.get(0))
        .map_err(|error| error.to_string())?;

    if current_version >= INITIAL_SCHEMA_VERSION {
        return Ok(());
    }

    connection
        .execute_batch(
            r#"
            BEGIN;

            CREATE TABLE IF NOT EXISTS connection_profiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                engine TEXT NOT NULL,
                host TEXT NOT NULL,
                port INTEGER NOT NULL,
                username TEXT NOT NULL,
                default_database TEXT,
                environment_label TEXT,
                read_only INTEGER NOT NULL DEFAULT 0,
                tls_mode TEXT NOT NULL,
                secret_ref TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS editor_recovery (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                workspace_key TEXT NOT NULL UNIQUE,
                engine TEXT,
                connection_profile_name TEXT,
                database_name TEXT,
                sql_text TEXT NOT NULL,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS action_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT,
                action_type TEXT NOT NULL,
                action_status TEXT NOT NULL,
                metadata_json TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            PRAGMA user_version = 1;
            COMMIT;
            "#,
        )
        .map_err(|error| error.to_string())?;

    Ok(())
}

fn open_connection(db_path: &str) -> Result<Connection, String> {
    Connection::open(db_path).map_err(|error| error.to_string())
}

fn find_connection_profile_by_name(
    connection: &Connection,
    name: &str,
) -> Result<Option<SavedConnectionProfile>, String> {
    let mut statement = connection
        .prepare(
            r#"
            SELECT
                name,
                engine,
                host,
                port,
                username,
                default_database,
                environment_label,
                read_only,
                tls_mode,
                secret_ref,
                updated_at
            FROM connection_profiles
            WHERE name = ?
            LIMIT 1
            "#,
        )
        .map_err(|error| error.to_string())?;

    let mut rows = statement.query(params![name]).map_err(|error| error.to_string())?;
    let Some(row) = rows.next().map_err(|error| error.to_string())? else {
        return Ok(None);
    };

    let secret_ref: Option<String> = row.get(9).map_err(|error| error.to_string())?;

    Ok(Some(SavedConnectionProfile {
        profile: ConnectionProfile {
            name: row.get(0).map_err(|error| error.to_string())?,
            engine: engine_from_str(&row.get::<_, String>(1).map_err(|error| error.to_string())?)
                .map_err(|error| error.to_string())?,
            host: row.get(2).map_err(|error| error.to_string())?,
            port: row.get(3).map_err(|error| error.to_string())?,
            username: row.get(4).map_err(|error| error.to_string())?,
            default_database: row.get(5).map_err(|error| error.to_string())?,
            environment_label: row.get(6).map_err(|error| error.to_string())?,
            read_only: row.get::<_, i64>(7).map_err(|error| error.to_string())? == 1,
            tls_mode: tls_mode_from_str(
                &row.get::<_, String>(8).map_err(|error| error.to_string())?,
            )
            .map_err(|error| error.to_string())?,
            secret_ref: secret_ref.clone(),
        },
        has_secret: secret_ref.is_some(),
        updated_at: row.get(10).map_err(|error| error.to_string())?,
    }))
}

fn engine_to_str(engine: &DatabaseEngine) -> &'static str {
    match engine {
        DatabaseEngine::PostgreSql => "postgresql",
        DatabaseEngine::MySql => "mysql",
    }
}

fn engine_from_str(value: &str) -> Result<DatabaseEngine, String> {
    match value {
        "postgresql" => Ok(DatabaseEngine::PostgreSql),
        "mysql" => Ok(DatabaseEngine::MySql),
        _ => Err(format!("Unsupported engine in local store: {value}")),
    }
}

fn tls_mode_to_str(mode: &TlsMode) -> &'static str {
    match mode {
        TlsMode::Disable => "disable",
        TlsMode::Prefer => "prefer",
        TlsMode::Require => "require",
        TlsMode::VerifyCa => "verify-ca",
        TlsMode::VerifyFull => "verify-full",
    }
}

fn tls_mode_from_str(value: &str) -> Result<TlsMode, String> {
    match value {
        "disable" => Ok(TlsMode::Disable),
        "prefer" => Ok(TlsMode::Prefer),
        "require" => Ok(TlsMode::Require),
        "verify-ca" => Ok(TlsMode::VerifyCa),
        "verify-full" => Ok(TlsMode::VerifyFull),
        _ => Err(format!("Unsupported TLS mode in local store: {value}")),
    }
}

fn to_sql_error(message: String) -> rusqlite::Error {
    rusqlite::Error::FromSqlConversionFailure(
        0,
        rusqlite::types::Type::Text,
        Box::new(std::io::Error::new(std::io::ErrorKind::InvalidData, message)),
    )
}

fn normalize_path(path: &PathBuf) -> String {
    path.display().to_string()
}
