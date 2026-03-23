# Adminer Desktop Epics and User Stories v2

## 1. Document Control

- Product: Adminer Desktop
- Version: v2
- Date: 2026-03-23
- Status: Revised Draft
- Source BRD: [`adminer-desktop-brd-v2.md`](/Users/purwaren/Projects/tools/adminer-desktop/docs/adminer-desktop-brd-v2.md)
- Source FRD: [`adminer-desktop-frd-v2.md`](/Users/purwaren/Projects/tools/adminer-desktop/docs/adminer-desktop-frd-v2.md)
- Source Technical Design: [`adminer-desktop-technical-design-v2.md`](/Users/purwaren/Projects/tools/adminer-desktop/docs/adminer-desktop-technical-design-v2.md)
- Source UX Spec: [`adminer-desktop-ux-spec-wireflow-v2.md`](/Users/purwaren/Projects/tools/adminer-desktop/docs/adminer-desktop-ux-spec-wireflow-v2.md)
- Prior Version: [`adminer-desktop-epics-user-stories.md`](/Users/purwaren/Projects/tools/adminer-desktop/docs/adminer-desktop-epics-user-stories.md)
- Critique: [`adminer-desktop-epics-user-stories-critique.md`](/Users/purwaren/Projects/tools/adminer-desktop/docs/adminer-desktop-epics-user-stories-critique.md)

## 2. Purpose

This document defines the revised backlog structure for Adminer Desktop. It sharpens the MVP scope, breaks stories into more buildable slices, adds sequencing and feasibility markers, and improves acceptance consistency for planning and QA.

## 3. Release and Milestone Model

## 3.1 MVP

Goal:

- prove the core product loop works end to end for PostgreSQL and MySQL

MVP success gate:

- a user can save and open a secure connection
- a user can browse explorer objects
- a user can run SQL and inspect results
- a user can browse table data
- a user can perform a basic row insert/edit/delete in a writable table
- read-only and production-safe baseline behaviors are active

## 3.2 v1

Goal:

- deliver the first practical admin workbench release

v1 success gate:

- MVP is stable
- schema editing works for supported v1 operations
- import/export flows work for common cases
- session/process visibility is usable
- local persistence, recovery, and action logging are present

## 3.3 v1.1

Goal:

- improve ergonomics, blocked states, and operational depth without changing product direction

## 4. Priority and Sequencing Labels

- `P0`: required for MVP
- `P1`: required for v1
- `P2`: targeted for v1.1 or polish
- `F`: feasibility-critical
- `W1`: implementation wave 1
- `W2`: implementation wave 2
- `W3`: implementation wave 3

## 5. Epic Overview

| Epic ID | Epic Name | Priority | Target | Notes |
|---|---|---:|---|---|
| EP-01 | App Shell and Workspace | P0 | MVP | Foundation |
| EP-02 | Connection Management and Security | P0 | MVP | Foundation, F |
| EP-03 | Session Lifecycle and Context | P0 | MVP | Foundation, F |
| EP-04 | Explorer and Object Discovery | P0 | MVP | Core loop |
| EP-05 | SQL Editor and Execution | P0 | MVP | Core loop, F |
| EP-06 | Results and Data Browsing | P0 | MVP | Core loop, F |
| EP-07 | Row Editing and Write Safety | P0 | MVP | Core loop, F |
| EP-08 | Schema Editing | P1 | v1 | Expansion |
| EP-09 | Import and Export | P1 | v1 | Expansion |
| EP-10 | Operational Visibility and Session Actions | P1 | v1 | Expansion |
| EP-11 | Local Persistence, Recovery, and Action Log | P1 | v1 | Expansion |
| EP-12 | Quality, Edge States, and Polish | P2 | v1.1 | Quality |

## 6. Dependency Summary

- EP-01, EP-02, and EP-03 are foundational
- EP-04 depends on connected session context from EP-03
- EP-05 depends on EP-01, EP-02, and EP-03
- EP-06 depends on EP-04 and EP-05
- EP-07 depends on EP-06 and safety mechanisms from EP-02 and EP-03
- EP-08 depends on EP-04 and EP-05
- EP-09 depends on EP-03 and EP-05
- EP-10 depends on EP-03
- EP-11 depends on EP-02, EP-03, and EP-05
- EP-12 spans all prior epics

## 7. Story Format

Each story includes:

- user value statement
- labels
- dependencies
- acceptance criteria

Acceptance criteria should be interpreted as the minimum testable outcome for backlog planning.

## 8. Epic Details and Stories

## EP-01 App Shell and Workspace

### Objective

Provide the shell, persistent context, tab model, and global state handling for the app.

#### US-01.01 Startup Shell

As a user, I want the app to open into a connection-first shell so that I can immediately begin setup or connect.

Labels:

- P0
- W1

Dependencies:

- none

Acceptance criteria:

- startup screen loads without requiring a DB connection
- saved connections are visible when present
- if no connections exist, an empty state explains the next step
- a primary `New Connection` action is visible

#### US-01.02 Persistent Context Bar

As a connected user, I want persistent session context so that I always know where I am working.

Labels:

- P0
- W1

Dependencies:

- US-03.01

Acceptance criteria:

- shell shows connection name, engine, database, and environment label
- read-only state is visible when active
- production-labeled state is visually distinct

#### US-01.03 Workspace Tabs

As a user, I want workspace tabs so that I can move between explorer, SQL, and data tasks without losing my place.

Labels:

- P0
- W1

Dependencies:

- US-01.01

Acceptance criteria:

- user can open multiple tabs
- user can close tabs individually
- SQL tabs show dirty state when content changes

#### US-01.04 Global State Surfaces

As a user, I want every major workspace surface to show clear state so that I understand whether it is loading, blocked, disconnected, unsupported, or failed.

Labels:

- P0
- W2

Dependencies:

- US-01.01

Acceptance criteria:

- loading, empty, error, disconnected, unsupported, and permission-blocked states exist in the shell system
- each state includes a user-readable explanation
- recoverable states expose a next useful action where possible

## EP-02 Connection Management and Security

### Objective

Allow users to create and manage secure PostgreSQL/MySQL connection profiles.

#### US-02.01 Create Connection Profile

As a user, I want to create a PostgreSQL or MySQL connection profile so that I can reconnect without re-entering details.

Labels:

- P0
- F
- W1

Dependencies:

- US-01.01

Acceptance criteria:

- required fields are name, engine, host, port, and username
- optional fields include password, default database, SSL/TLS settings, environment label, and read-only mode
- invalid required fields block save

#### US-02.02 Test Connection

As a user, I want to test a connection before saving so that I can validate settings safely.

Labels:

- P0
- F
- W1

Dependencies:

- US-02.01

Acceptance criteria:

- user can trigger test from the form
- success and failure states are shown
- unreachable host and failed authentication are distinguishable when possible

#### US-02.03 Manage Saved Connections

As a returning user, I want to edit, duplicate, favorite, and delete connections so that I can organize environments efficiently.

Labels:

- P0
- W1

Dependencies:

- US-02.01

Acceptance criteria:

- user can edit a saved connection
- user can duplicate a saved connection
- user can favorite or unfavorite a connection
- delete requires confirmation

#### US-02.04 Secure Secret Storage

As a security-conscious user, I want credentials stored securely so that secrets are not exposed in plain text.

Labels:

- P0
- F
- W1

Dependencies:

- US-02.01

Acceptance criteria:

- passwords are stored in OS-backed secure storage where available
- the app does not silently store passwords in plain text
- unavailable secure storage results in explicit fallback handling

## EP-03 Session Lifecycle and Context

### Objective

Handle connection sessions, reconnect/disconnect behavior, and safety context.

#### US-03.01 Open Session

As a user, I want to connect from a saved profile so that I can begin working quickly.

Labels:

- P0
- F
- W1

Dependencies:

- US-02.01
- US-02.02

Acceptance criteria:

- user can connect from the startup screen or connection list
- shell remains responsive during session initialization
- on success, explorer metadata begins loading

#### US-03.02 Disconnect and Reconnect

As a user, I want to recover from disconnects so that I can continue working without confusion.

Labels:

- P0
- W2

Dependencies:

- US-03.01

Acceptance criteria:

- user can disconnect intentionally
- user can retry after failure
- session-bound tabs show disconnected state until restored or closed

#### US-03.03 Read-Only Enforcement

As a cautious user, I want read-only mode to block write actions so that I cannot accidentally mutate data or schema.

Labels:

- P0
- F
- W2

Dependencies:

- US-03.01

Acceptance criteria:

- write controls are disabled in read-only mode
- write SQL is blocked
- blocked actions explain why they are unavailable

#### US-03.04 Production-Safe Context

As an operator, I want production-labeled sessions to use stronger guardrails so that destructive mistakes are harder to make.

Labels:

- P0
- W2

Dependencies:

- US-03.01

Acceptance criteria:

- production label is visible in connected state
- destructive confirmations are stronger for production-labeled sessions
- the UI does not imply automatic environment verification

## EP-04 Explorer and Object Discovery

### Objective

Provide responsive discovery of databases, schemas, tables, and views.

#### US-04.01 Browse Explorer

As a user, I want to browse database objects so that I can inspect structure quickly.

Labels:

- P0
- W1

Dependencies:

- US-03.01

Acceptance criteria:

- PostgreSQL sessions expose databases/schemas/tables/views appropriately
- MySQL sessions expose databases/tables/views appropriately
- unsupported constructs are not presented misleadingly

#### US-04.02 Search Explorer

As a user, I want to search object names so that I can find tables and views faster.

Labels:

- P0
- W2

Dependencies:

- US-04.01

Acceptance criteria:

- explorer supports text filtering
- results update without full app reload

#### US-04.03 Open Object in Tab

As a user, I want to open objects in workspace tabs so that I can inspect multiple items in parallel.

Labels:

- P0
- W2

Dependencies:

- US-04.01

Acceptance criteria:

- user can open table detail and view detail in tabs
- opening a new object does not replace other tabs

#### US-04.04 Lazy Metadata Loading

As a user working with large schemas, I want the explorer to load progressively so that the app stays responsive.

Labels:

- P0
- F
- W2

Dependencies:

- US-04.01

Acceptance criteria:

- explorer does not eagerly preload all metadata
- expanding large branches remains responsive in normal use

## EP-05 SQL Editor and Execution

### Objective

Provide a practical SQL workbench for PostgreSQL and MySQL.

#### US-05.01 Open SQL Tab

As a user, I want to open SQL editor tabs so that I can write and run queries.

Labels:

- P0
- W1

Dependencies:

- US-01.03
- US-03.01

Acceptance criteria:

- user can open multiple SQL tabs
- each tab preserves its own unsaved text while open

#### US-05.02 Run Current Statement

As a user, I want to run the current SQL statement so that I can execute focused queries quickly.

Labels:

- P0
- F
- W1

Dependencies:

- US-05.01

Acceptance criteria:

- current statement execution returns rows, status, or error outcome
- editor content remains visible after execution

#### US-05.03 Run Selection or Full Editor

As a user, I want to run selected SQL or the full editor so that I can work flexibly with scripts.

Labels:

- P0
- W2

Dependencies:

- US-05.02

Acceptance criteria:

- user can run selected SQL
- user can run full editor content
- UI distinguishes rows returned, affected rows, and script completion

#### US-05.04 SQL Error and Warning Display

As a user, I want query outcomes explained clearly so that I can fix problems quickly.

Labels:

- P0
- W2

Dependencies:

- US-05.02

Acceptance criteria:

- errors show plain-language summary
- technical details are available
- warnings are surfaced when supported

#### US-05.05 Query Cancellation

As a user, I want to cancel long-running queries so that I can recover from expensive mistakes.

Labels:

- P0
- F
- W2

Dependencies:

- US-05.02

Acceptance criteria:

- long-running queries expose a cancel action
- cancel success or failure is shown clearly

#### US-05.06 Query History

As a repeat user, I want query history per connection so that I can reuse recent work.

Labels:

- P0
- W3

Dependencies:

- US-05.02
- US-11.01

Acceptance criteria:

- query history is stored per connection
- user can reopen a previous query
- history excludes secret data where controlled by the app

## EP-06 Results and Data Browsing

### Objective

Render query results and enable paged table browsing.

#### US-06.01 Render Query Results

As a user, I want structured result rendering so that I can inspect returned data efficiently.

Labels:

- P0
- F
- W1

Dependencies:

- US-05.02

Acceptance criteria:

- results render in a grid
- columns are scrollable when needed
- result summary includes duration and row/affected count when available

#### US-06.02 Open Table Data View

As a user, I want to open table data directly so that I can inspect rows without writing SQL first.

Labels:

- P0
- W2

Dependencies:

- US-04.03

Acceptance criteria:

- user can open a table data tab from explorer or table detail
- initial load is bounded and paged

#### US-06.03 Filter and Sort Data

As a user, I want filtering and sorting in table data so that I can find records quickly.

Labels:

- P0
- W2

Dependencies:

- US-06.02

Acceptance criteria:

- user can add filters
- user can sort by columns
- user can reset filters and sorting

#### US-06.04 Configure Visible Columns

As a user, I want to show or hide columns so that I can focus on relevant fields.

Labels:

- P1
- W3

Dependencies:

- US-06.02

Acceptance criteria:

- user can hide visible columns
- user can restore hidden columns

## EP-07 Row Editing and Write Safety

### Objective

Support controlled row mutation with clear safety behavior.

#### US-07.01 Insert Row via Row Form

As a user, I want to insert a row through a guided form so that I can add data safely without writing SQL.

Labels:

- P0
- F
- W2

Dependencies:

- US-06.02
- US-03.03

Acceptance criteria:

- insert uses a row-form editing pattern
- validation errors are shown before commit where possible
- successful insert updates visible data state

#### US-07.02 Edit Simple Scalar Values

As a user, I want quick edits for simple values so that I can make small corrections efficiently.

Labels:

- P0
- W3

Dependencies:

- US-06.02
- US-03.03

Acceptance criteria:

- inline quick edit is available only for eligible writable simple values
- non-eligible fields route to row-form editing
- blocked edits explain why

#### US-07.03 Edit Full Row

As a user, I want full-row editing so that I can update multiple fields safely in one place.

Labels:

- P0
- F
- W2

Dependencies:

- US-06.02
- US-03.03

Acceptance criteria:

- row-form edit is available for writable rows
- save success and failure states are shown clearly
- non-writable tables disable edit actions with explanation

#### US-07.04 Clone Row

As a user, I want to clone a row so that I can duplicate similar data quickly.

Labels:

- P1
- W3

Dependencies:

- US-07.03

Acceptance criteria:

- clone is available for writable tables
- cloned values can be reviewed before save

#### US-07.05 Delete Selected Rows

As a user, I want to delete rows with confirmation so that I can remove data safely.

Labels:

- P0
- F
- W2

Dependencies:

- US-06.02
- US-03.04

Acceptance criteria:

- delete requires confirmation
- production-labeled sessions use elevated confirmation where required
- success and failure states are shown clearly

#### US-07.06 Relation Navigation

As a user, I want to follow foreign key relationships so that I can move between related data quickly.

Labels:

- P1
- W3

Dependencies:

- US-06.02
- US-04.03

Acceptance criteria:

- relationship navigation appears only when metadata exists
- unavailable relations do not show broken affordances

## EP-08 Schema Editing

### Objective

Support guided schema changes with SQL preview.

#### US-08.01 Create Table

As a user, I want to create a table from a guided form so that I can define structure without hand-writing DDL.

Labels:

- P1
- W3

Dependencies:

- US-04.03
- US-05.02

Acceptance criteria:

- user can define table name and at least one column
- form validates required input before preview
- generated SQL is shown before execution

#### US-08.02 Alter Table Basic Columns

As a user, I want to change supported column properties so that I can evolve a table through the UI.

Labels:

- P1
- W3

Dependencies:

- US-08.01

Acceptance criteria:

- user can add, remove, and edit supported column properties
- SQL preview is mandatory
- non-transactional risk is surfaced when relevant

#### US-08.03 Create and Drop Index

As a user, I want to create and drop indexes so that I can manage performance and uniqueness.

Labels:

- P1
- W3

Dependencies:

- US-04.03

Acceptance criteria:

- user can create standard and unique indexes
- dropping an index requires confirmation
- SQL preview is shown before execution

#### US-08.04 Create and Drop Foreign Key

As a user, I want to create and drop foreign keys so that I can manage referential integrity.

Labels:

- P1
- W3

Dependencies:

- US-04.03

Acceptance criteria:

- user can choose source column, target table, and target column
- unsupported actions are blocked clearly
- SQL preview is shown before execution

#### US-08.05 Create and Alter View

As a user, I want to create or alter views so that I can manage reusable SQL projections from the UI.

Labels:

- P1
- W3

Dependencies:

- US-04.03
- US-05.01

Acceptance criteria:

- user can create and alter standard views
- definition is editable in a dedicated schema-edit surface
- SQL preview is shown before execution

## EP-09 Import and Export

### Objective

Provide practical import/export workflows for common admin tasks.

#### US-09.01 Import SQL File

As a user, I want to import a SQL file so that I can run scripted changes or restores.

Labels:

- P1
- W3

Dependencies:

- US-05.02

Acceptance criteria:

- user can choose a SQL file
- execution options are visible before run
- progress and failure summary are shown

#### US-09.02 Import CSV/TSV into Table

As a user, I want to import CSV/TSV data into a selected table so that I can load operational data without writing import scripts.

Labels:

- P1
- W3

Dependencies:

- US-06.02

Acceptance criteria:

- user can choose file and target table
- user can map columns
- validation runs before import begins
- summary distinguishes validation failure from execution failure

#### US-09.03 Export Query Results

As a user, I want to export result sets so that I can use the data outside the app.

Labels:

- P1
- W3

Dependencies:

- US-06.01

Acceptance criteria:

- export is available from result views
- supported formats are clear before export

#### US-09.04 Export Table Data or Schema

As a user, I want to export selected table data or object schema so that I can back up or move information between environments.

Labels:

- P1
- W3

Dependencies:

- US-04.03

Acceptance criteria:

- user can export selected table data
- user can export selected object schema
- unsupported export types are hidden or disabled clearly

## EP-10 Operational Visibility and Session Actions

### Objective

Provide runtime visibility and safe session control.

#### US-10.01 View Runtime Metadata

As a user, I want runtime metadata so that I can confirm version and environment characteristics.

Labels:

- P1
- W3

Dependencies:

- US-03.01

Acceptance criteria:

- user can view server version and engine metadata
- unsupported metadata is handled clearly

#### US-10.02 View Active Sessions

As an operator, I want to inspect active sessions so that I can identify problematic activity.

Labels:

- P1
- W3

Dependencies:

- US-03.01

Acceptance criteria:

- user can open a session/process list
- common fields such as session ID, user, database, state, and duration are shown when available

#### US-10.03 Kill Session

As an operator, I want to terminate a selected session with clear confirmation so that I can resolve blocking or runaway activity safely.

Labels:

- P1
- W3

Dependencies:

- US-10.02
- US-03.04

Acceptance criteria:

- confirmation shows target session identity
- production-labeled sessions require elevated confirmation
- success refreshes the session list

## EP-11 Local Persistence, Recovery, and Action Log

### Objective

Persist essential local app state without exposing secrets.

#### US-11.01 Persist Connection Metadata

As a returning user, I want connection metadata saved locally so that I do not need to recreate connections each session.

Labels:

- P1
- W2

Dependencies:

- US-02.01
- US-02.04

Acceptance criteria:

- connection metadata is stored locally
- secret references are stored without exposing raw passwords

#### US-11.02 Recover Unsaved SQL

As a user, I want unsaved SQL restored after restart so that I do not lose work after interruption.

Labels:

- P1
- W3

Dependencies:

- US-05.01

Acceptance criteria:

- unsaved SQL editor content can be restored after restart
- restored content never auto-runs

#### US-11.03 Record Action Log Entries

As a user, I want a local record of write/admin actions so that I can understand what I did through the UI.

Labels:

- P1
- W3

Dependencies:

- US-03.03
- US-03.04
- US-07.05

Acceptance criteria:

- action log stores timestamp, action type, target, and success/failure
- action log does not store secrets

## EP-12 Quality, Edge States, and Polish

### Objective

Strengthen blocked states, unsupported states, keyboard behavior, and overall quality after the core loop works.

#### US-12.01 Distinguish Blocked and Unsupported States

As a user, I want blocked and unsupported actions explained clearly so that I know whether the issue is permissions, engine support, or mode restrictions.

Labels:

- P2
- W3

Dependencies:

- US-01.04

Acceptance criteria:

- permission-blocked, unsupported, disconnected, and generic-error states are visually distinct
- each state offers the next useful action where possible

#### US-12.02 Keyboard Efficiency

As a power user, I want predictable keyboard behavior so that I can work quickly without relying on the mouse.

Labels:

- P2
- W3

Dependencies:

- US-05.01

Acceptance criteria:

- SQL execution shortcut works
- explorer is keyboard navigable
- dialogs handle focus safely

#### US-12.03 Workspace and History Ergonomics

As a repeat user, I want better recovery and history ergonomics so that repeated work becomes faster.

Labels:

- P2
- W3

Dependencies:

- US-11.02
- US-05.06

Acceptance criteria:

- workspace recovery improves beyond minimum SQL restoration
- query history is easier to review and reopen

## 9. Suggested Delivery Order

## 9.1 Wave 1

- EP-01 foundation shell
- EP-02 secure connection profiles
- EP-03 open session baseline
- EP-04 explorer baseline
- EP-05 SQL current-statement execution
- EP-06 result rendering baseline

## 9.2 Wave 2

- read-only and production-safe controls
- table data browsing
- row insert/edit/delete baseline
- disconnect/reconnect handling
- global states
- local connection persistence

## 9.3 Wave 3

- schema editing
- import/export
- session/process visibility
- action log
- higher-level blocked-state polish

## 10. Planning Notes

When moving this backlog into an implementation tracker:

- split engine-specific work where PostgreSQL and MySQL differ materially
- keep feasibility-critical stories visible
- preserve the wave labels for sequencing
- do not inflate P0 with ergonomics that can wait for v1 or v1.1

## 11. Summary

This revised backlog is intended to be more buildable than the prior draft:

- MVP is narrower and more explicit
- story granularity is better
- feasibility-critical work is easier to see
- acceptance criteria are more consistent
- waves provide a more practical planning path

The next strongest step is to convert this backlog into a milestone roadmap or engineering ticket breakdown.
