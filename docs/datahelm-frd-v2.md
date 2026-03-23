# DataHelm FRD v2

## 1. Document Control

- Product: DataHelm
- Version: v2
- Date: 2026-03-23
- Status: Final Draft
- Source: [`datahelm-brd-v2.md`](/Users/purwaren/Projects/tools/adminer-desktop/docs/datahelm-brd-v2.md)

## 2. Purpose

This document defines the functional behavior required for DataHelm v1. It is intended to guide product design, engineering implementation, and QA validation for the first release.

## 3. Release Scope

### In Scope for v1

- Connection management
- Active connection/session handling
- Schema explorer
- SQL editor and result viewer
- Data browser with core row editing
- Core schema editing for tables, indexes, foreign keys, and views
- SQL import and result/object export
- Operational visibility for sessions and metadata
- Safety controls and local action logging

### Deferred Beyond v1

- User and privilege management
- Schema diagrams
- Routine, trigger, event, and sequence authoring UIs
- Linux release target
- Built-in SSH tunnel management unless added without affecting v1 timeline
- Advanced saved snippet management beyond basic query history

## 4. Global Product Rules

### FR-001 Supported Engines

- The app must support PostgreSQL and MySQL only in v1
- Unsupported engines must not appear as selectable connection types

Acceptance criteria:

- User cannot create a SQLite, SQL Server, Oracle, or other non-supported connection type

### FR-002 Platform Target

- The product must run on macOS in v1
- Windows compatibility may be prepared but is not required for v1 acceptance

### FR-003 User-Declared Environment Labels

- Every connection may be tagged as local, development, staging, or production
- These labels are user-declared safety hints, not trusted environment detection
- The UI must never imply that the label is verified automatically unless such verification exists

Acceptance criteria:

- Connection creation and edit forms allow environment label selection
- The active connection banner displays the selected label

## 5. Required UI States

The following states are required across relevant modules:

- Loading
- Empty
- Error
- Disconnected
- Permission denied, where determinable
- Unsupported action, where engine or mode blocks the action

Acceptance criteria:

- Each major functional area must display one of these states instead of failing silently

## 6. Module Requirements

### Module A: Workspace Shell

#### FR-101 Shell Navigation

- The app must provide stable top-level navigation for Connections, Explorer, SQL, and Results
- User must be able to move between these areas without losing the active connection context

Acceptance criteria:

- Switching views does not disconnect the database session
- Switching views does not clear unsaved SQL text in the current editor tab

#### FR-102 Active Connection Banner

- The shell must display active connection name, engine, current database, current schema if relevant, environment label, and read-only status

Acceptance criteria:

- Banner updates when user changes database/schema context
- Banner visibly distinguishes production and read-only sessions

### Module B: Connection Management

#### FR-201 Create Connection Profile

- User can create a PostgreSQL or MySQL connection profile with:
- Profile name
- Engine
- Host
- Port
- Username
- Optional password
- Optional default database
- Optional SSL/TLS settings
- Optional environment label
- Optional read-only mode

Acceptance criteria:

- Missing required fields block save
- Invalid port values block save

#### FR-202 Edit, Duplicate, Delete, Favorite

- User can edit, duplicate, delete, and favorite a saved connection profile

Acceptance criteria:

- Delete requires confirmation
- Duplicate creates a new profile with a new identifier

#### FR-203 Test Connection

- User can test a connection profile before saving or connecting
- The app must return success or human-readable failure details

Acceptance criteria:

- Test result is visible inline or in a result panel
- Failed authentication and unreachable host are distinguishable when driver output permits

#### FR-204 Credential Storage

- Secrets must be stored in OS-backed secure storage where available
- If secure storage is unavailable, the app must require an explicit user decision before storing credentials locally
- Passwords must never be written to general application logs

### Module C: Connection Sessions

#### FR-301 Connect

- User can open a session from a saved connection profile
- The app must initialize metadata asynchronously and keep the shell responsive

Acceptance criteria:

- User can continue interacting with the shell while metadata loads

#### FR-302 Disconnect and Reconnect

- User can disconnect a session intentionally
- User can retry connection after a disconnect or failure
- Open tabs tied to the session must show disconnected state until closed or reconnected

### Module D: Schema Explorer

#### FR-401 Explorer Hierarchy

- PostgreSQL explorer must support databases, schemas, tables, and views
- MySQL explorer must support databases, tables, and views
- Related object metadata such as indexes and foreign keys must be reachable from object detail pages or expandable tree nodes

Acceptance criteria:

- PostgreSQL sessions expose schema navigation
- MySQL sessions do not present PostgreSQL-only schema constructs as if they were supported

#### FR-402 Explorer Search

- User can search/filter object names within the current connection context

#### FR-403 Open Object

- User can open table or view details from the explorer without replacing existing tabs

#### FR-404 Lazy Metadata Loading

- The explorer must lazy-load or progressively load large object sets instead of preloading all metadata up front

### Module E: Object Detail

#### FR-501 Table Detail

- Table detail page must show:
- Column name
- Type
- Nullability
- Default value where available
- Comment where available
- Index summary
- Foreign key summary

Acceptance criteria:

- If comments are unsupported or unavailable, the UI must omit or mark the field unavailable rather than erroring

#### FR-502 View Detail

- View detail page must show the object definition where retrievable from the engine and current privileges
- If the definition is unavailable, the app must show an unavailable state

### Module F: SQL Editor

#### FR-601 Editor Tabs

- User can open multiple SQL editor tabs in the same session

#### FR-602 SQL Execution

- User can execute:
- Current statement
- Selected SQL text
- Entire editor content

Acceptance criteria:

- Results panel identifies whether execution returned rows, affected rows, or only status

#### FR-603 Multi-Statement Behavior

- For multi-statement execution, the app must present each statement outcome in order or provide a summary with navigation to per-statement results

#### FR-604 Query Cancellation

- User can request query cancellation where the underlying engine/session supports it
- If cancellation is unsupported or fails, the app must communicate that clearly

#### FR-605 Query History

- The app must persist query history per connection
- User can reopen a past query into a new or current SQL tab

Acceptance criteria:

- History excludes passwords or secret material when detectable from app-controlled forms

### Module G: Results Viewer

#### FR-701 Results Grid

- Query results must render in a scrollable grid
- Grid must support horizontal scroll and column resizing
- The app must page or stream results by default to avoid unbounded in-memory loading

#### FR-702 Result Summary

- Results UI must show:
- Execution duration
- Returned row count or affected row count when available
- Error or warning summary

#### FR-703 Result Export

- User can export the current result set to CSV, TSV, or JSON

### Module H: Data Browser

#### FR-801 Table Data View

- User can open a table data tab
- Initial row load must be bounded by default

#### FR-802 Filtering and Sorting

- User can filter by one or more columns
- User can sort by one or more columns
- User can reset filters and sorting

Acceptance criteria:

- The active filter and sort state is visible in the data view

#### FR-803 Column Visibility

- User can choose which columns are visible in the current data tab

#### FR-804 Row Create and Edit

- User can insert a new row
- User can edit an existing row
- The product may use row form editing, inline editing, or a hybrid pattern, but the chosen pattern must preserve validation clarity and change review before commit

Acceptance criteria:

- Validation errors are shown before commit where client-side validation is possible

#### FR-805 Row Clone and Delete

- User can clone an existing row
- User can delete one or more selected rows
- Delete must follow safety rules from the safety module

#### FR-806 Foreign Key Navigation

- When relationship metadata is available, user can navigate from a referencing value to related data

#### FR-807 Unsupported Write States

- If the table is not writable due to permissions, missing primary key semantics, or read-only mode, the app must disable write actions and explain why

### Module I: Schema Editing

#### FR-901 Create Table

- User can create a table with at least:
- Table name
- One or more columns
- Per-column type
- Nullability
- Default value when supported

#### FR-902 Alter Table

- User can alter an existing table by:
- Adding columns
- Removing columns
- Changing type
- Changing nullability
- Changing default
- Editing comments where supported

#### FR-903 Index Management

- User can create and drop indexes
- User can create unique indexes
- The UI must prevent submission without required index fields

#### FR-904 Foreign Key Management

- User can create and drop foreign keys
- User must specify source column, target table, target column, and supported actions when applicable

#### FR-905 View Management

- User can create and alter standard views
- If the engine or privileges block a change, the app must surface the failure clearly

#### FR-906 SQL Preview and Confirmation

- Schema changes must show generated SQL before execution
- User must confirm before execution

Acceptance criteria:

- A schema change cannot be executed from the UI without the preview/confirmation step

### Module J: Import and Export

#### FR-1001 SQL Import

- User can execute a SQL file against the active database
- User can choose stop-on-error or continue-on-error behavior if the execution model supports it

#### FR-1002 CSV/TSV Import

- User can import CSV or TSV into a selected table
- User can map source columns to destination columns
- The app must validate column mapping before execution

#### FR-1003 Object Export

- User can export:
- Current result set
- Selected table data
- Selected object schema
- Combined schema and data for selected objects when supported by the export implementation

### Module K: Operational Visibility

#### FR-1101 Runtime Metadata

- User can inspect server version and runtime metadata appropriate to the engine

#### FR-1102 Session List

- User can inspect active sessions with enough detail to identify long-running or blocked work, as available from the engine
- PostgreSQL and MySQL session columns may differ, and the UI may normalize or label them per engine

#### FR-1103 Kill Session

- User can terminate a selected session after confirmation
- High-risk confirmation rules apply for production-labeled connections

#### FR-1104 Guided Maintenance

- The app may expose a limited set of maintenance actions in v1
- Only actions confirmed as supported for the active engine may be shown as enabled

### Module L: Safety and Audit

#### FR-1201 Read-Only Mode

- Read-only mode must block all UI write flows
- Read-only mode must block execution of statements classified by the app as DDL or write operations
- If the classifier is uncertain, the app must warn and block unless the session is not read-only

Acceptance criteria:

- Insert, update, delete, drop, alter, truncate, create, and similar statements are blocked in read-only mode

#### FR-1202 Destructive Confirmation Policy

- The app must require confirmation for:
- Row delete
- Drop object actions
- Truncate actions
- Kill session
- Guided maintenance actions with destructive impact

#### FR-1203 Production Confirmation Escalation

- For production-labeled connections, destructive actions must require stronger confirmation than non-production
- Stronger confirmation may include object-name typing or explicit textual confirmation

#### FR-1204 Local Action Log

- The app must record a local log for write/admin actions initiated through the UI
- Minimum log fields:
- Timestamp
- Connection profile name
- Environment label
- Action type
- Target object if known
- Success/failure status

#### FR-1205 Action Log Privacy

- The action log must not store passwords, tokens, or secret values
- SQL text may be redacted or summarized for high-risk actions if needed to avoid secret exposure

## 7. Persistence Requirements

### FR-1301 Persisted Data

- The app must persist:
- Connection profiles
- Query history
- User preferences for safety-relevant settings
- Minimal session recovery information for unsaved SQL tabs

### FR-1302 Recovery Behavior

- After unexpected shutdown, the app should offer to restore unsaved SQL tabs
- Restoration must not auto-rerun prior queries

## 8. Error and Validation Requirements

### FR-1401 Human-Readable Errors

- User-facing errors must include a plain-language summary
- Raw engine details may appear in an expandable technical section

### FR-1402 Form Validation

- Required form inputs must be validated before execution
- Validation failures must identify the problematic field or rule

### FR-1403 Unsupported Features

- If a feature is unsupported by the active engine, the UI must disable or hide it rather than permitting execution and failing late when possible

## 9. Performance Requirements

### FR-1501 Startup

- App startup target is under 4 seconds on target hardware

### FR-1502 UI Responsiveness

- Background metadata loads and query execution must not freeze the primary UI shell

### FR-1503 Result Safety

- The app must not fetch unlimited result sets by default into memory

## 10. Acceptance Summary

The final v1 release is functionally acceptable when:

- A user can save and open PostgreSQL and MySQL connections
- A user can browse schema objects and open details
- A user can run SQL and inspect results
- A user can browse table data and perform core row edits
- A user can perform basic schema changes with SQL preview
- A user can import SQL and CSV/TSV data and export key outputs
- A user can inspect sessions/metadata and terminate sessions with guardrails
- Production-labeled sessions clearly enforce stricter destructive-action behavior

## 11. Out of Scope

- User/privilege administration
- Schema diagrams
- Full routine/trigger/event/sequence authoring
- Collaboration
- Engines beyond PostgreSQL and MySQL
