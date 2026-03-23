use std::time::{SystemTime, UNIX_EPOCH};

use crate::contracts::{QueryJob, QueryJobState};

pub fn session_supervisor_note() -> &'static str {
    "session supervisor boundary established"
}

pub fn new_query_job(sql: &str) -> QueryJob {
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_millis())
        .unwrap_or_default();

    QueryJob {
        job_id: format!("job-{timestamp}"),
        state: QueryJobState::Running,
        submitted_sql: Some(sql.to_string()),
    }
}

pub fn complete_query_job(mut job: QueryJob, state: QueryJobState) -> QueryJob {
    job.state = state;
    job
}
