#[derive(Debug, Clone)]
pub struct SafetyBlock {
    pub classification: &'static str,
    pub reason: String,
}

pub fn classify_sql_for_execution(sql: &str, read_only: bool) -> Result<(), SafetyBlock> {
    let trimmed = sql.trim();
    if trimmed.is_empty() {
        return Err(SafetyBlock {
            classification: "empty-statement",
            reason: "SQL execution failed: statement is empty".to_string(),
        });
    }

    if !read_only {
        return Ok(());
    }

    if trimmed.contains(';') && trimmed.trim_end_matches(';').contains(';') {
        return Err(SafetyBlock {
            classification: "multi-statement-blocked",
            reason: "Read-only mode blocks multi-statement execution.".to_string(),
        });
    }

    let normalized = trimmed.trim_start().to_ascii_lowercase();
    let safe_prefixes = ["select", "with", "show", "explain", "describe", "values"];
    if safe_prefixes.iter().any(|prefix| normalized.starts_with(prefix)) {
        return Ok(());
    }

    let blocked_prefixes = [
        "insert",
        "update",
        "delete",
        "merge",
        "replace",
        "create",
        "alter",
        "drop",
        "truncate",
        "rename",
        "grant",
        "revoke",
        "call",
        "do",
        "copy",
        "load",
        "lock",
        "analyze",
        "vacuum",
        "refresh",
        "set",
        "use",
        "kill",
        "begin",
        "commit",
        "rollback",
    ];

    if blocked_prefixes
        .iter()
        .any(|prefix| normalized.starts_with(prefix))
    {
        return Err(SafetyBlock {
            classification: "blocked-write-or-ddl",
            reason: "Read-only mode blocks write, DDL, and session-mutating SQL.".to_string(),
        });
    }

    Err(SafetyBlock {
        classification: "blocked-uncertain",
        reason: "Read-only mode failed closed because the SQL statement could not be safely classified.".to_string(),
    })
}
