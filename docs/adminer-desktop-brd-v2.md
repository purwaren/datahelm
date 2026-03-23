# Adminer Desktop BRD v2

## 1. Document Control

- Product: Adminer Desktop
- Version: v2
- Date: 2026-03-23
- Status: Revised Draft
- Scope: Desktop database administration app focused on PostgreSQL and MySQL

## 2. Product Positioning

Adminer Desktop is a desktop-native database administration tool for developers and technical operators who want the speed and directness of Adminer, but with better desktop UX, stronger production safety, and deeper PostgreSQL/MySQL workflows.

It is not intended to be an all-database enterprise suite. It is a focused workbench for day-to-day schema inspection, SQL execution, data editing, and operational troubleshooting.

## 3. Product Differentiation

Adminer Desktop will differentiate by combining:

- Fast startup and low interface overhead
- PostgreSQL and MySQL specific depth rather than broad engine sprawl
- Production-safe workflows with environment-aware guardrails
- A clean path from exploration to action
- Generated SQL visibility for admin operations

## 4. Problem Statement

Current tools often force users to choose between lightweight but limited admin experiences and powerful but heavy, cluttered desktop suites. Users need a faster and safer tool for PostgreSQL and MySQL that handles the most common administration workflows well without overwhelming the interface.

## 5. Target Release Strategy

### Launch Audience

- Individual developers
- Small engineering teams
- Consultants and agencies
- Technical operators who regularly work with PostgreSQL and MySQL

### Launch Platform

- macOS first
- Windows second, targeted immediately after initial stabilization
- Linux deferred until demand and packaging feasibility are validated

## 6. Personas

### Persona A: Backend Developer

Needs to inspect schema, run SQL, edit a few rows, and verify migrations quickly.

### Persona B: Technical Operator

Needs to inspect runtime state, kill sessions, export data, and troubleshoot issues safely in staging or production.

### Persona C: Power User / DBA in Small Team

Needs efficient object browsing, repeatable SQL workflows, and trustworthy guardrails for admin actions.

## 7. Product Goals

- Make the common PostgreSQL/MySQL admin workflow fast and obvious
- Reduce accidental destructive actions, especially in production
- Support both SQL-first and UI-first usage styles
- Keep the app responsive on large schemas and moderate-to-large result sets
- Deliver a polished macOS-first v1 with a clear path to Windows

## 8. Non-Goals for v1

- Supporting engines beyond PostgreSQL and MySQL
- Multi-user collaboration
- In-app privilege/user management
- In-app schema diagramming
- Full routine/event authoring UI
- Enterprise approval workflows

## 9. Core User Journeys

### Journey 1: Connect and Explore

1. User opens the app
2. User selects or creates a saved connection
3. User sees environment badge and connection safety mode
4. User explores databases, schemas, tables, and views
5. User opens object detail pages in tabs

### Journey 2: Query and Inspect

1. User opens SQL editor
2. User writes or pastes query
3. User runs query and sees results, timing, warnings, and row counts
4. User exports result or saves the query

### Journey 3: Edit Data Safely

1. User opens a table data grid
2. User filters rows
3. User edits or inserts data
4. User reviews changes
5. User confirms write action when required by safety policy

### Journey 4: Change Schema with Confidence

1. User opens table designer
2. User modifies table or index structure
3. User sees generated SQL preview
4. User applies change after confirmation
5. User receives success/failure feedback and action log entry

## 10. Functional Scope

### 10.1 V1 Core Features

#### Connection Management

- Save, edit, duplicate, delete, and favorite connections
- PostgreSQL and MySQL support
- SSL/TLS configuration
- Test connection before save
- OS-backed credential storage where available
- Environment labels: local, development, staging, production
- Optional read-only connection mode

#### Schema Explorer

- Browse databases and schemas
- Browse tables, views, indexes, foreign keys, and key metadata
- Search/filter objects
- Open multiple object tabs
- Lazy-load metadata for large databases

#### SQL Editor

- Run single and multi-statement SQL
- Query history by connection/database
- Save snippets/favorites
- Syntax highlighting
- Export result sets
- Cancel running query where supported

#### Data Browser

- Paginated result grid
- Filter, sort, and select visible columns
- Edit row and insert row
- Clone and delete selected rows
- Follow foreign key relations
- Download binary/blob field values where applicable

#### Schema Editing

- Create and alter tables
- Manage columns, nullability, defaults, and comments
- Create and alter indexes
- Create and alter foreign keys
- Create and alter views
- Preview generated SQL before apply

#### Import / Export

- Import SQL file into active database
- Import CSV/TSV into selected table
- Export query results
- Export schema only, data only, or both for selected objects

#### Operational Visibility

- PostgreSQL activity / MySQL process list
- View variables/status/version metadata
- Kill session with safety confirmation
- Run supported maintenance commands from guided UI

### 10.2 Deferred Features

- User and privilege management
- Schema diagram
- Trigger authoring UI
- Routine authoring UI
- Event authoring UI
- Sequence management UI
- Built-in SSH tunnel management if launch risk is high

## 11. Safety Model

### 11.1 Risk Levels

- Low risk: read-only browsing and metadata inspection
- Medium risk: row inserts/updates/deletes in non-production
- High risk: destructive DDL, bulk deletes, truncates, drops, kill session, maintenance in production

### 11.2 Required Guardrails

- Environment badge visible at all times
- Production connections default to stricter confirmation behavior
- Generated SQL preview for schema changes and destructive actions
- Clear destructive styling and wording
- Read-only mode must block write actions entirely
- Optional requirement to type object name for high-risk destructive actions in production
- Local action log for write/admin operations

## 12. UX Requirements

- Primary navigation must expose Connections, Explorer, SQL, and Results clearly
- The app must support both mouse and keyboard-heavy workflows
- Frequent tasks must be reachable without modal overload
- Advanced controls should be progressively disclosed
- Errors should include actionable explanations, not only raw driver messages
- Default views should favor safe inspection before write workflows

## 13. Technical Assumptions

- The app is local-first and single-user
- Metadata and history are stored locally
- Query results must be paginated or streamed rather than fully materialized by default
- UI architecture must avoid blocking the main thread during metadata loads and query execution
- v1 architecture should optimize for startup time and maintainability over plugin extensibility

## 14. Non-Functional Requirements

### Performance

- Cold start target: under 4 seconds on a standard developer laptop
- Metadata navigation target: under 700 ms for common cached transitions
- First result rows target: under 1.5 seconds for moderate queries under healthy network conditions

### Security

- Credentials stored securely using OS-backed secrets when possible
- No plain-text password logging
- Clipboard handling for secrets should be minimized and never automatic
- Audit log must exclude secrets and sensitive payloads

### Reliability

- Unsaved SQL must be restorable after crash or restart
- Failed queries must not corrupt app state
- Connection drops should surface reconnect guidance without freezing the app

## 15. Success Metrics

### Adoption

- 60% of new users create at least one saved connection on day 1
- 50% of new users run a query within the first session

### Engagement

- 70% of weekly active users use SQL editor weekly
- 50% of weekly active users use explorer weekly
- 30% of weekly active users use data editing or import/export monthly

### Quality

- Crash-free session rate above 99%
- Median cold start under 4 seconds
- Less than 1% of destructive operations in production are abandoned after confirmation screen due to confusion, measured via internal telemetry if enabled

## 16. Delivery Phasing

### Phase 1: Foundation

- macOS app shell
- Connection manager
- Explorer
- SQL editor
- Query results grid

### Phase 2: Core Admin Workflows

- Row editing
- Table and index editing
- Import/export
- Process list and metadata panels

### Phase 3: Safety and Polish

- Production-safe mode
- Action log
- Performance tuning
- Packaging and onboarding improvements

## 17. Risks

- MySQL and PostgreSQL parity may increase complexity faster than expected
- Desktop packaging and signing may delay launch
- Large result sets and large schemas may stress memory and rendering if streaming is weak
- Safety friction may annoy developers if not tuned carefully

## 18. Open Questions

- Should built-in SSH tunneling be included in v1 or deferred
- Should Windows packaging begin in parallel or after macOS launch
- What telemetry, if any, is acceptable for product improvement
- Should read-only mode be per connection, per session, or both

## 19. Final v1 Recommendation

Adminer Desktop v1 should launch as a macOS-first PostgreSQL/MySQL workbench centered on four core strengths:

- Fast connection and exploration
- Strong SQL execution workflow
- Safe data and schema editing
- Clear operational visibility for day-to-day database work

This version should intentionally avoid overreaching into every advanced admin domain. The first release will succeed if it becomes the fastest tool users open for everyday PostgreSQL/MySQL tasks, while earning trust through clear production guardrails.
