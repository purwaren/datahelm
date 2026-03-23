# Adminer Desktop Data and State Model v2

## 1. Document Control

- Product: Adminer Desktop
- Version: v2
- Date: 2026-03-23
- Status: Revised Draft
- Source BRD: [`adminer-desktop-brd-v2.md`](/Users/purwaren/Projects/tools/adminer-desktop/docs/adminer-desktop-brd-v2.md)
- Source FRD: [`adminer-desktop-frd-v2.md`](/Users/purwaren/Projects/tools/adminer-desktop/docs/adminer-desktop-frd-v2.md)
- Source Technical Design: [`adminer-desktop-technical-design-v2.md`](/Users/purwaren/Projects/tools/adminer-desktop/docs/adminer-desktop-technical-design-v2.md)
- Source UX Spec: [`adminer-desktop-ux-spec-wireflow-v2.md`](/Users/purwaren/Projects/tools/adminer-desktop/docs/adminer-desktop-ux-spec-wireflow-v2.md)
- Source Backlog: [`adminer-desktop-epics-user-stories-v2.md`](/Users/purwaren/Projects/tools/adminer-desktop/docs/adminer-desktop-epics-user-stories-v2.md)
- Prior Version: [`adminer-desktop-data-state-model.md`](/Users/purwaren/Projects/tools/adminer-desktop/docs/adminer-desktop-data-state-model.md)
- Critique: [`adminer-desktop-data-state-model-critique.md`](/Users/purwaren/Projects/tools/adminer-desktop/docs/adminer-desktop-data-state-model-critique.md)

## 2. Purpose

This document defines the revised data and state model for Adminer Desktop v1. It adds scope labels, lifecycle rules, stronger privacy boundaries, user-facing persistence expectations, and state invariants to make implementation and QA more consistent.

## 3. Revision Summary

Compared with v1, this version:

- marks which entities are MVP-required versus broader v1
- clarifies runtime and cache lifecycle rules
- distinguishes logical entities, persisted records, and API DTOs more explicitly
- adds retention, clearability, and redaction guidance
- defines stickiness/reset behavior for user-facing state
- adds invariants and recovery expectations

## 4. Modeling Principles

- Keep secrets out of general app storage whenever possible
- Separate persisted user data from transient runtime state
- Keep frontend state minimal and derived when practical
- Treat database metadata and query results as session-scoped remote state
- Prefer explicit invalidation over hidden mutation
- Make state ownership obvious
- Persist only what clearly improves user value or recovery

## 5. State Categories

Adminer Desktop uses five main categories of state:

1. persisted app data
2. secure secret data
3. session runtime state
4. fetched metadata and result state
5. transient UI state

## 6. Scope Labels for Modeled Entities

- `MVP`: required to prove the core loop
- `v1`: required for first practical release
- `Later`: useful but not required for initial release

## 7. Model Layers

To avoid confusion, the model should be interpreted across three layers:

1. logical domain entities
2. persisted storage records
3. API/runtime DTOs

## 7.1 Logical Domain Entities

Examples:

- connection profile
- session
- job
- query history entry
- action log entry

## 7.2 Persisted Storage Records

Examples:

- SQLite rows for connection profiles
- SQLite rows for query history
- keychain secret entries

## 7.3 API / Runtime DTOs

Examples:

- normalized table metadata sent to frontend
- paged query result payloads
- live process/session list payloads

## 8. Persisted App Data

Stored locally in SQLite.

### MVP Required

- connection profiles
- user preferences

### v1 Required

- query history
- editor recovery state
- action log
- schema migrations

### Later

- broader workspace recovery
- more advanced per-connection UI state persistence

## 9. Secure Secret Data

Stored in OS-backed secure storage where available.

### MVP Required

- database passwords

### Later

- future SSH or tunnel secrets

## 10. Session Runtime State

Owned by backend runtime and memory only.

### MVP Required

- active sessions
- active jobs
- query cancellation handles
- capability maps

### v1 Required

- richer reconnect/disconnect tracking
- import/export job state

## 11. Fetched Metadata and Result State

Fetched from PostgreSQL/MySQL and cached per session.

### MVP Required

- explorer data
- object details needed for table/view browsing
- query results
- table data pages

### v1 Required

- session/process list
- runtime metadata panels

## 12. Transient UI State

Owned by the frontend.

### MVP Required

- active tab
- open dialogs
- local form drafts
- current row-edit draft

### v1 Required

- import flow draft state
- richer job tray visibility state

## 13. Persisted Entity Model

## 13.1 ConnectionProfile

Scope:

- MVP

Purpose:

- saved database connection definition without raw secret

Core fields:

- `id`
- `name`
- `engine`
- `host`
- `port`
- `username`
- `default_database`
- `ssl_mode`
- `tls_verify_mode`
- `environment_label`
- `read_only_default`
- `secret_ref`
- `is_favorite`
- `created_at`
- `updated_at`

Rules:

- `engine` only supports `postgresql` or `mysql`
- `secret_ref` points to secure storage, not a raw password
- `environment_label` is advisory only

## 13.2 UserPreference

Scope:

- MVP

Purpose:

- global user settings for the app

Core fields:

- `key`
- `value_json`
- `updated_at`

Examples:

- theme preference
- result page size
- query history retention

## 13.3 QueryHistoryEntry

Scope:

- v1

Purpose:

- bounded historical record of SQL execution

Core fields:

- `id`
- `connection_profile_id`
- `engine`
- `database_name`
- `schema_name`
- `query_text`
- `execution_mode`
- `duration_ms`
- `status`
- `executed_at`

Rules:

- bounded retention by age or count
- user must be able to clear history
- history must never intentionally store passwords
- diagnostics export must not include history automatically without explicit user action

## 13.4 EditorRecoveryEntry

Scope:

- v1

Purpose:

- restore unsaved SQL editor content after restart

Core fields:

- `id`
- `workspace_tab_id`
- `connection_profile_id`
- `engine`
- `database_name`
- `schema_name`
- `editor_title`
- `content`
- `selection_state_json`
- `updated_at`

Rules:

- only unsaved SQL drafts belong here
- restored content must never auto-run
- recovery entries are clearable by the user

## 13.5 ActionLogEntry

Scope:

- v1

Purpose:

- local record of UI-initiated write/admin actions

Core fields:

- `id`
- `timestamp`
- `connection_profile_id`
- `environment_label`
- `session_id`
- `job_id`
- `action_type`
- `target_type`
- `target_name`
- `status`
- `summary`

Rules:

- `status`: `started`, `success`, `failure`, `blocked`
- users should be able to clear action log entries
- secrets and imported raw payloads must never appear here

## 13.6 SchemaMigration

Scope:

- v1

Purpose:

- track local SQLite schema migrations

Core fields:

- `version`
- `applied_at`

## 14. Secure Secret Model

## 14.1 SecretReference

Scope:

- MVP

Purpose:

- lookup pointer from SQLite into secure storage

Logical fields:

- `provider`
- `lookup_key`

## 14.2 Secret Content Rules

Can contain:

- password

Must not appear in:

- SQLite app data
- query history
- action log
- recovery state
- general diagnostics bundles by default

## 15. Backend Runtime Entity Model

## 15.1 Session

Scope:

- MVP

Purpose:

- one active connected app session

Core fields:

- `session_id`
- `connection_profile_id`
- `engine`
- `database_name`
- `schema_name`
- `environment_label`
- `read_only_effective`
- `capability_map`
- `connection_status`
- `opened_at`

Lifecycle:

- created on successful connect
- updated on context change or connection health change
- disposed on disconnect or app shutdown

States:

- `connecting`
- `connected`
- `degraded`
- `disconnected`
- `failed`

## 15.2 CapabilityMap

Scope:

- MVP

Purpose:

- session-scoped feature flags

Core fields:

- `supports_schemas`
- `supports_cancel_query`
- `supports_kill_session`
- `supports_view_definition`
- `supports_comments`
- `supports_foreign_keys`
- `supports_guided_maintenance`

Rule:

- frontend relies on capability map rather than engine name alone for behavior gating

## 15.3 Job

Scope:

- MVP

Purpose:

- track long-running or inspectable backend work

Core fields:

- `job_id`
- `session_id`
- `job_type`
- `status`
- `progress_current`
- `progress_total`
- `started_at`
- `finished_at`
- `summary`
- `is_cancellable`

Lifecycle:

- created before backend work begins
- updated during progress
- finished with terminal state
- retained in memory only for bounded recent history unless persisted indirectly through action log

Terminal states:

- `success`
- `failure`
- `cancelled`

## 15.4 QueryExecution

Scope:

- MVP

Purpose:

- live SQL execution instance tied to a job

Core fields:

- `execution_id`
- `job_id`
- `session_id`
- `statement_summary`
- `classification`
- `started_at`
- `cancel_handle_ref`

Lifecycle:

- created when execution starts
- destroyed when execution completes or fails
- never persisted

## 16. Normalized Remote Domain Model

These objects come from PostgreSQL/MySQL and are normalized for frontend use.

## 16.1 DatabaseObjectRef

Scope:

- MVP

Core fields:

- `engine`
- `database_name`
- `schema_name`
- `object_type`
- `object_name`

## 16.2 TableSummary

Scope:

- MVP

Core fields:

- `ref`
- `row_count_estimate`
- `comment`
- `is_writable`

## 16.3 ViewSummary

Scope:

- MVP

Core fields:

- `ref`
- `comment`
- `definition_available`

## 16.4 ColumnDefinition

Scope:

- MVP

Core fields:

- `name`
- `data_type`
- `nullable`
- `default_value`
- `comment`
- `is_primary_key`
- `is_unique`
- `is_generated`
- `is_editable`

## 16.5 IndexDefinition

Scope:

- v1

Core fields:

- `name`
- `kind`
- `columns`
- `is_unique`

## 16.6 ForeignKeyDefinition

Scope:

- v1

Core fields:

- `name`
- `source_columns`
- `target_object_ref`
- `target_columns`
- `on_delete`
- `on_update`

## 16.7 ProcessEntry

Scope:

- v1

Core fields:

- `session_identifier`
- `user_name`
- `database_name`
- `state`
- `duration_ms`
- `statement_summary`

## 16.8 QueryResultPage

Scope:

- MVP

Core fields:

- `result_id`
- `columns`
- `rows`
- `row_count_known`
- `row_count`
- `affected_rows`
- `duration_ms`
- `has_more`
- `page_cursor`
- `warnings`
- `error`

Rules:

- not persisted by default
- cache is session-scoped and short-lived

## 17. Frontend State Model

## 17.1 ShellState

Scope:

- MVP

Fields:

- `active_session_id`
- `open_tabs`
- `active_tab_id`
- `sidebar_collapsed`
- `job_tray_visible`

Persistence behavior:

- survives normal in-session navigation
- does not need full restart persistence in MVP

## 17.2 TabState

Scope:

- MVP

Fields:

- `tab_id`
- `tab_type`
- `title`
- `session_id`
- `dirty`
- `closable`

Tab types:

- `sql_editor`
- `table_detail`
- `view_detail`
- `table_data`
- `schema_edit`
- `import`
- `export`
- `operations`

## 17.3 SQLTabDraftState

Scope:

- MVP for in-memory use, v1 for recovery persistence

Fields:

- `tab_id`
- `content`
- `selection_range`
- `last_run_mode`
- `last_result_id`

Persistence behavior:

- survives tab switches
- survives app restart only through `EditorRecoveryEntry`

## 17.4 DataViewState

Scope:

- MVP

Fields:

- `tab_id`
- `filters`
- `sorts`
- `visible_columns`
- `selected_row_keys`
- `page_size`
- `current_cursor`

Persistence behavior:

- survives tab switches during current session
- may reset on tab close
- restart persistence is not required for MVP

## 17.5 RowEditDraftState

Scope:

- MVP

Fields:

- `draft_id`
- `tab_id`
- `mode`
- `row_identity`
- `field_values`
- `validation_errors`

Modes:

- `insert`
- `edit`
- `clone`

Persistence behavior:

- survives within current edit flow
- may be discarded on tab close or disconnect in v1
- restart persistence is not required

## 17.6 DialogState

Scope:

- MVP

Fields:

- `dialog_type`
- `open`
- `payload`

Dialog types:

- `delete_confirmation`
- `destructive_confirmation`
- `kill_session_confirmation`
- `connection_delete_confirmation`

## 18. Stickiness and Reset Rules

## 18.1 Should Persist Across Tab Switch

- SQL editor drafts
- data view filters and sorting
- visible columns
- selected current row edit draft while tab remains open

## 18.2 Should Reset on Tab Close

- row edit drafts
- table data temporary selections
- transient dialog state

## 18.3 Should Persist Across App Restart

- connection profiles
- preferences
- query history
- action log
- unsaved SQL editor recovery entries

## 18.4 Should Not Persist Across App Restart

- live sessions
- active jobs
- query result cache
- open confirmation dialogs
- row edit drafts

## 19. Cache and Invalidation Rules

## 19.1 Explorer Metadata Cache

Scope:

- session-scoped

Invalidated when:

- session reconnects
- schema edit succeeds
- manual refresh occurs

## 19.2 Table Data Cache

Scope:

- session-scoped and tab-sensitive

Invalidated when:

- row insert/edit/delete succeeds
- import to same table succeeds
- manual refresh occurs

## 19.3 Query Result Cache

Scope:

- short-lived session-scoped

Disposal rules:

- may be released on tab close
- must be released on session disposal
- restart persistence is not supported

## 20. State Flow Patterns

## 20.1 Read Pattern

1. frontend requests data
2. backend validates session
3. adapter fetches/normalizes data
4. frontend cache stores response by query key
5. UI renders state

## 20.2 Write Pattern

1. frontend submits command
2. backend validates safety and permissions
3. backend executes adapter operation
4. backend writes action log when applicable
5. frontend invalidates affected caches
6. UI renders success/failure and refreshed state

## 20.3 Recovery Pattern

1. app starts
2. local SQLite is opened and migrated
3. recovery entries are loaded
4. user is offered unsaved SQL restoration
5. restored tabs load as drafts only

## 21. Invariants

These conditions should always be true:

- a `ConnectionProfile.secret_ref` must never be a raw password
- a `Session` must reference a valid connection profile while active
- a `Job.session_id` must reference an active or recently disposed session context
- a `QueryExecution.job_id` must reference an existing job while execution is live
- a `QueryResultPage` must not outlive its session cache boundary indefinitely
- `EditorRecoveryEntry` must never trigger auto-execution
- `ActionLogEntry` and `QueryHistoryEntry` must not intentionally store secrets

## 22. Failure and Recovery Expectations

## 22.1 Corrupt SQLite State

Expected behavior:

- app surfaces the issue clearly
- app avoids silent data loss
- app may offer backup-and-reset recovery

## 22.2 Missing Secret for Saved Connection

Expected behavior:

- connection profile still appears
- app prompts for credential re-entry when connect is attempted
- secret reference can be repaired

## 22.3 Stale Cache After Write

Expected behavior:

- affected explorer/data caches are invalidated
- refreshed state replaces stale state after successful refetch

## 22.4 Disconnected Session During Job

Expected behavior:

- active job resolves to failure or disconnected state clearly
- session-bound UI surfaces disconnected state
- no hidden retry is assumed for destructive work

## 23. Suggested Local SQLite Schema

The SQL schema can evolve, but v1 should roughly map to:

```text
connection_profiles
  id
  name
  engine
  host
  port
  username
  default_database
  ssl_mode
  tls_verify_mode
  environment_label
  read_only_default
  secret_ref
  is_favorite
  created_at
  updated_at

user_preferences
  key
  value_json
  updated_at

query_history
  id
  connection_profile_id
  engine
  database_name
  schema_name
  query_text
  execution_mode
  duration_ms
  status
  executed_at

editor_recovery
  id
  workspace_tab_id
  connection_profile_id
  engine
  database_name
  schema_name
  editor_title
  content
  selection_state_json
  updated_at

action_log
  id
  timestamp
  connection_profile_id
  environment_label
  session_id
  job_id
  action_type
  target_type
  target_name
  status
  summary

schema_migrations
  version
  applied_at
```

## 24. Privacy and Retention Rules

- query history retention must be bounded
- action log retention must be bounded
- users should be able to clear query history and action log
- diagnostics bundles must exclude secrets by default
- recovery state must exclude passwords and imported raw sensitive content

## 25. Example Validation Scenarios

Examples QA should validate:

- saved connection exists but keychain secret is missing
- user restarts app and SQL draft is restored without execution
- row edit succeeds and invalidates table-data cache
- schema change succeeds and invalidates explorer/object metadata
- read-only mode blocks a write SQL command and does not create unsafe persisted artifacts

## 26. Recommendations

The recommended implementation approach remains:

- SQLite for persisted app data
- keychain-backed secret references for passwords
- backend runtime ownership for sessions, jobs, capabilities, and live execution
- frontend ownership only for interaction-local state
- explicit invalidation after writes rather than hidden optimistic mutation

This revised model should make the roadmap, QA strategy, and implementation tasks cleaner and more predictable than the prior version.
