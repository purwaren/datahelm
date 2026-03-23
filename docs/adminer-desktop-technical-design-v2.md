# Adminer Desktop Technical Design v2

## 1. Document Control

- Product: Adminer Desktop
- Version: v2
- Date: 2026-03-23
- Status: Revised Draft
- Source BRD: [`adminer-desktop-brd-v2.md`](/Users/purwaren/Projects/tools/adminer-desktop/docs/adminer-desktop-brd-v2.md)
- Source FRD: [`adminer-desktop-frd-v2.md`](/Users/purwaren/Projects/tools/adminer-desktop/docs/adminer-desktop-frd-v2.md)
- Prior Version: [`adminer-desktop-technical-design.md`](/Users/purwaren/Projects/tools/adminer-desktop/docs/adminer-desktop-technical-design.md)
- Critique: [`adminer-desktop-technical-design-critique.md`](/Users/purwaren/Projects/tools/adminer-desktop/docs/adminer-desktop-technical-design-critique.md)

## 2. Purpose

This document defines the revised preferred technical architecture for Adminer Desktop v1 and adds clearer decision boundaries, narrower v1 technical scope, stronger operational safeguards, and explicit spike exit criteria.

## 3. Revision Summary

Compared with v1, this version:

- narrows the v1 baseline to reduce execution risk
- makes key technology choices more explicit
- adds fallback triggers for major architecture decisions
- defines a stronger runtime model for sessions and jobs
- improves TLS, secret, and logging rules
- adds local storage migration strategy
- adds testing and spike pass/fail criteria

## 4. Technical Design Principles

- Prefer disciplined simplicity over maximum flexibility in v1
- Keep all database access out of the frontend
- Make engine-specific differences explicit at the adapter layer
- Treat safety enforcement as a backend concern, not only a UI concern
- Design for recoverability of state, not automatic replay of risky actions
- Optimize the common case before building advanced admin surfaces

## 5. Scope Boundaries

## 5.1 P0 Technical Scope

These items must work for v1 feasibility:

- app shell and navigation
- connection profiles and secure secrets
- session lifecycle
- schema explorer
- SQL editor and result rendering
- paged data browser
- core row editing
- core schema editing for tables, indexes, foreign keys, and views
- import/export baseline
- safety model
- local persistence

## 5.2 P1 Technical Scope

These are valuable but may slip without invalidating the architecture:

- polished query cancellation UX
- enhanced workspace recovery
- richer data-grid ergonomics
- guided maintenance actions beyond a minimal set

## 5.3 Deferred

- plugin system
- collaboration
- privilege management
- routine/trigger/event authoring UI
- Linux packaging

## 6. Architecture Decision Status

## 6.1 Desktop Shell

Decision:

- Prefer Tauri v2

Why:

- better fit for startup and memory goals
- good alignment with a local-first utility
- strong OS integration support

Fallback:

- Electron

Revisit trigger:

- If core spikes show the team cannot deliver backend-critical features in Rust at acceptable velocity after the first technical spike cycle

## 6.2 Frontend Stack

Decision:

- React + TypeScript

Why:

- fast team onboarding
- large ecosystem
- easy state and component composition for complex admin workflows

## 6.3 SQL Editor Choice

Decision:

- Prefer CodeMirror 6

Why:

- lighter than Monaco
- better fit for Tauri startup and bundle goals
- sufficient for syntax highlighting, selection execution, and controlled editor behavior in v1

Fallback:

- Monaco only if advanced editor requirements clearly outgrow CodeMirror

## 6.4 Result Grid Strategy

Decision:

- Build a constrained grid using TanStack Table plus virtualization primitives rather than adopting a very large enterprise grid

Why:

- keeps v1 feature scope narrow
- avoids overcommitting to spreadsheet behavior
- gives better control over performance and editing complexity

Revisit trigger:

- If row editing and virtualization requirements become too complex during spike work

## 6.5 Backend Runtime

Decision:

- Rust backend services running behind Tauri commands

Why:

- better fit for connection/session control, query cancellation, and secret handling

## 7. Recommended Stack

- Desktop shell: Tauri v2
- Frontend: React + TypeScript
- Editor: CodeMirror 6
- UI state: Zustand
- Async/query cache: TanStack Query
- Grid: TanStack Table + row/column virtualization
- Backend: Rust
- Local DB: SQLite
- Secret storage: macOS Keychain in v1

## 8. High-Level Architecture

The application should be split into five logical layers:

1. Presentation layer
2. API bridge layer
3. Application services layer
4. Adapter/runtime layer
5. Persistence and OS integration layer

## 8.1 Presentation Layer

Responsibilities:

- render all user-facing screens
- manage transient UI state
- request data and actions through typed client APIs
- display required UI states:
- loading
- empty
- error
- disconnected
- unsupported
- permission blocked

Constraint:

- no direct database access

## 8.2 API Bridge Layer

Responsibilities:

- expose a typed boundary between frontend and backend
- centralize command invocation
- normalize error envelopes

Reasoning:

- prevents arbitrary direct command calls from scattered UI components
- improves testability and future refactoring

## 8.3 Application Services Layer

Responsibilities:

- input validation
- safety policy evaluation
- session orchestration
- SQL classification
- action logging
- shaping adapter data into app-facing DTOs

## 8.4 Adapter/Runtime Layer

Responsibilities:

- engine-specific metadata retrieval
- query execution
- cancellation
- import/export batching
- session/process operations

## 8.5 Persistence and OS Integration Layer

Responsibilities:

- SQLite local state
- keychain integration
- file system import/export
- crash recovery state
- structured debug logs

## 9. Runtime Model

## 9.1 Core Runtime Entities

- `ConnectionProfile`
- `Session`
- `Job`
- `QueryExecution`
- `MetadataSnapshot`
- `ActionLogEntry`

## 9.2 Session Supervisor

Introduce a `SessionSupervisor` in the backend.

Responsibilities:

- create and dispose sessions
- hold per-session capability map
- track running jobs
- coordinate reconnect/disconnect
- invalidate metadata caches after write actions

Reasoning:

- centralizes cross-cutting runtime concerns
- prevents execution and metadata logic from scattering across services

## 9.3 Job Model

Every long-running backend task should execute as a `Job`.

Initial job types:

- metadata load
- SQL execution
- data-grid fetch
- SQL import
- CSV/TSV import
- export generation
- kill session

Each job should expose:

- job ID
- session ID
- type
- status
- created time
- started time
- finished time
- progress if available
- cancellation support flag
- result summary

This makes the runtime easier to reason about than a set of disconnected async calls.

## 10. Adapter Contract

Define a shared adapter interface with engine-specific implementations.

Minimum adapter responsibilities:

- connect
- disconnect
- test connection
- fetch databases
- fetch schemas if supported
- fetch explorer objects
- fetch object details
- execute SQL
- cancel execution
- fetch paged table data
- perform supported schema actions
- import data
- export data/schema
- fetch sessions/processes
- kill session

Minimum adapter metadata:

- engine type
- version
- capability map
- session identity

Reasoning:

- keeps PostgreSQL and MySQL differences isolated
- provides a stable contract for service and UI layers

## 11. Database Connectivity Strategy

## 11.1 PostgreSQL

Preferred driver:

- `tokio-postgres`

Required capabilities:

- TLS
- cancellation
- metadata introspection
- streaming/chunk retrieval
- session termination

## 11.2 MySQL

Preferred driver:

- `mysql_async`

Required capabilities:

- TLS
- metadata introspection
- chunk retrieval
- session/process actions where supported

## 11.3 Connection Topology

For each open session:

- one control connection for metadata and lightweight operations
- one execution path per active long-running query or editor tab as needed

Reasoning:

- isolates blocking operations
- improves cancellation behavior
- prevents a long query from stalling all activity

## 11.4 Transport Security Rules

Defaults:

- prefer TLS-enabled connections where available
- certificate validation should be enabled by default when TLS is configured

If the user disables verification:

- the UI must warn clearly
- the saved connection must retain that insecure setting explicitly

Important:

- environment labels do not replace proper transport security

## 12. Metadata and Capability Design

## 12.1 Normalized Metadata Model

Normalize these concepts for UI use:

- database
- schema
- table
- view
- column
- index
- foreign key
- session/process entry

## 12.2 Capability Map

Each session must expose explicit feature flags such as:

- `supportsSchemas`
- `supportsCancelQuery`
- `supportsKillSession`
- `supportsViewDefinition`
- `supportsComments`
- `supportsForeignKeys`
- `supportsGuidedMaintenance`
- `supportsTransactionalDdlForAction`

The frontend should key behavior from this capability map rather than infer support from engine name only.

## 13. SQL Editor and Execution Design

## 13.1 Editor Requirements

The SQL editor must support:

- syntax highlighting
- multi-tab editing
- run current statement
- run selected SQL
- run full document
- preserve unsaved text across navigation

## 13.2 Execution Flow

Execution flow:

1. frontend submits execution request
2. service layer validates safety mode
3. SQL classifier labels statement risk
4. session supervisor creates a job
5. adapter executes and streams summary/results
6. audit service records completion outcome if relevant

## 13.3 Multi-Statement Strategy

Do not attempt heavy SQL parsing in v1.

Instead:

- support simple multi-statement execution through engine-aware splitting only where reliable
- otherwise execute as a script using driver-supported semantics

Reasoning:

- reduces parser complexity
- avoids incorrect statement splitting edge cases

## 13.4 Query History Policy

Persist:

- SQL text
- timestamp
- connection profile reference
- database/schema context
- duration
- success/failure

Do not persist:

- passwords
- imported file contents as history entries
- hidden secret values injected through forms

Retention:

- make history retention configurable
- default to bounded retention rather than unbounded growth

## 14. Results and Data Grid Design

## 14.1 v1 Grid Scope

The grid is intentionally narrow in v1.

Included:

- paged browsing
- sorting
- filtering
- column show/hide
- row select
- basic inline edit for simple values
- row-form edit for full-row changes

Excluded:

- spreadsheet-like formulas
- bulk cell paste workflows
- infinite Excel-style editing semantics

## 14.2 Rendering Strategy

- use virtualization for rows
- avoid rendering very wide tables eagerly
- page or chunk data from backend rather than storing full result sets client-side

## 14.3 Write Eligibility Rules

Rows are writable only if the backend determines a safe identity exists:

1. primary key
2. unique constraint
3. explicit safe engine-specific fallback

If not writable:

- keep the grid read-only
- explain why

## 15. Schema Editing Strategy

## 15.1 v1 Philosophy

Schema editing in v1 is guided SQL generation, not generalized schema diffing.

## 15.2 Supported Operations

- create table
- alter table limited column operations
- create/drop index
- create/drop foreign key
- create/alter view

## 15.3 Transaction Annotation

The backend must mark schema actions as:

- transactional
- partially transactional
- non-transactional

The UI must surface this before execution for risky actions.

## 16. Safety Architecture

## 16.1 Safety Enforcement Layers

Safety must be enforced at:

1. UI
2. service layer
3. execution layer

This is unchanged from v1 and remains mandatory.

## 16.2 Environment Labels

Environment labels are advisory, user-declared metadata.

They are used for:

- stronger confirmation policy
- visual warnings
- safer defaults

They are not proof of actual environment identity.

## 16.3 Read-Only Enforcement

Read-only mode must:

- disable write UI
- reject write/DDL/admin statements in the service layer
- reject unsupported bypass attempts before adapter execution

If classification is uncertain:

- block in read-only mode

## 16.4 SQL Classification Policy

Use a conservative classifier with these classes:

- read
- write
- DDL
- admin/ops
- unknown

Rules:

- unknown is blocked in read-only mode
- destructive classes trigger stronger confirmations in production-labeled sessions
- manual SQL in writable production sessions is allowed only with visible warnings and confirmation where the action is clearly destructive

## 16.5 Action Logging Policy

Minimum fields:

- timestamp
- connection profile name
- environment label
- action type
- target object if known
- session/job ID
- success/failure

Redaction rules:

- no passwords
- no tokens
- no raw file import contents
- SQL may be summarized or redacted if it includes detected secrets

Retention:

- bounded retention by size or age
- user-visible clear-history control

## 17. Local Storage Design

## 17.1 Storage Engine

- SQLite for local app state

## 17.2 Core Tables

- `connection_profiles`
- `query_history`
- `editor_recovery`
- `preferences`
- `action_log`
- `schema_migrations`

## 17.3 Migration Strategy

Add explicit local DB migrations.

Requirements:

- every schema change is versioned
- app startup runs pending migrations before app data use
- failed migration should halt destructive use of local state and surface recovery options

## 17.4 Corruption and Recovery

If the local database is unreadable or corrupt:

- the app must surface the issue clearly
- the app should offer backup-and-reset if feasible
- secret storage in OS keychain should remain unaffected

## 18. Secret Storage Design

## 18.1 Preferred Design

- macOS Keychain in v1
- store secret references in SQLite, not raw passwords

## 18.2 Fallback Policy

If keychain integration fails:

- prefer password re-entry over insecure local persistence
- allow encrypted local fallback only if explicitly designed and approved

## 18.3 Recovery State Rules

Recovery data must not store:

- plaintext passwords
- connection secrets
- imported sensitive file contents

## 19. Import and Export Design

## 19.1 SQL Import

Implementation rules:

- run as a job
- stream progress to UI
- preserve partial failure information
- do not keep full imported file contents in history

## 19.2 CSV/TSV Import

Implementation rules:

- read sample/header first
- validate mapping before execute
- process rows in batches
- surface row-level or batch-level errors clearly enough for user correction

## 19.3 Export

v1 export target:

- result sets
- selected table data
- selected object schema

Do not target full parity with `pg_dump` or `mysqldump` in v1.

## 20. Operational Visibility Design

## 20.1 Session List

Adapters should normalize common fields:

- session ID
- user
- database
- state/status
- duration
- current statement summary

Engine-specific details should appear in an expandable details panel.

## 20.2 Kill Session

Kill session must:

- route through the safety service
- create an auditable job/action entry
- present explicit target identity before confirmation

## 21. Frontend State and Caching

## 21.1 State Split

- Zustand for local UI/workspace state
- TanStack Query for async resource fetching and cache invalidation

## 21.2 Cache Rules

- metadata cache scoped per session
- result cache short-lived
- write actions invalidate affected metadata and table-data queries

## 21.3 Required Frontend States

Each major screen must support:

- loading
- empty
- error
- disconnected
- unsupported
- permission blocked

## 22. Observability and Debug Logging

## 22.1 Structured App Logs

The app should produce structured debug logs for:

- app startup
- session open/close
- query start/finish/cancel
- import/export start/finish
- storage migration outcomes

These logs must exclude secrets by design.

## 22.2 User-Facing Failure Diagnostics

When practical, allow users to:

- copy technical details
- export a sanitized diagnostic bundle

This will materially help support and QA.

## 23. Testing Strategy

## 23.1 Test Pyramid

- unit tests for classifier, validators, and service logic
- integration tests for PostgreSQL/MySQL adapters
- frontend component tests for core interaction surfaces
- end-to-end smoke tests for critical workflows

## 23.2 Critical Automated Paths

- create/test/save connection
- connect and browse explorer
- run SQL and render results
- read-only rejection of write SQL
- create table/index via generated SQL preview flow
- import CSV sample validation
- kill session confirmation path

## 23.3 Architecture Decision Records

Major technical decisions should be captured as ADRs for:

- Tauri vs Electron
- editor choice
- grid choice
- adapter contract
- local storage schema policy

## 24. Packaging and Distribution

## 24.1 macOS v1

Requirements:

- signed bundle
- notarization
- stable app data path
- keychain integration verification

## 24.2 Windows Readiness

Keep macOS-specific code isolated behind thin wrappers so Windows keychain and packaging can be added later without major architectural churn.

## 25. Repository Structure

```text
adminer-desktop/
  src-ui/
    app/
    modules/
    components/
    state/
    api/
    lib/
  src-tauri/
    src/
      main.rs
      commands/
      services/
      adapters/
      runtime/
      models/
      storage/
      security/
      logging/
  docs/
```

## 26. Technical Risks

## 26.1 Rust Delivery Velocity

Risk:

- team may move too slowly in Rust for app-critical backend work

Mitigation:

- keep backend interfaces simple
- avoid premature abstraction
- measure spike throughput explicitly

## 26.2 Driver Capability Gaps

Risk:

- cancellation and streaming behavior may vary in ways that affect UX promises

Mitigation:

- validate adapter contract early with both engines

## 26.3 Grid Complexity

Risk:

- data-grid scope can balloon and dominate delivery

Mitigation:

- keep v1 grid constrained
- prefer row-form editing over aggressive spreadsheet semantics

## 26.4 Safety False Positives / False Negatives

Risk:

- SQL classification may block safe SQL or miss unusual risky SQL

Mitigation:

- conservative defaults
- visible warnings
- layered enforcement

## 27. Feasibility Recommendation

Adminer Desktop remains technically feasible as a macOS-first v1, but only under a disciplined architecture and scope model.

The recommended path is still:

- Tauri + React + TypeScript + Rust
- CodeMirror instead of Monaco for v1
- constrained custom grid rather than oversized enterprise grid
- native PostgreSQL/MySQL adapters
- SQLite local state
- macOS Keychain secret storage
- session supervisor and job-based runtime model

## 28. Spike Plan with Exit Criteria

## 28.1 Spike 1: Connectivity and Metadata

Goal:

- prove session lifecycle and metadata retrieval for PostgreSQL and MySQL

Pass criteria:

- connect successfully to both engines
- fetch databases/schemas/tables/views metadata
- produce a capability map for each session
- keep UI responsive during metadata load

## 28.2 Spike 2: Query and Results

Goal:

- prove execution, cancellation, and result rendering architecture

Pass criteria:

- execute single statement and multi-statement SQL
- stream or chunk results into grid
- cancel a long-running PostgreSQL query
- demonstrate acceptable behavior for MySQL cancellation path

## 28.3 Spike 3: Safety, Storage, and Recovery

Goal:

- prove the local-state and safety baseline

Pass criteria:

- persist connection profiles to SQLite
- store secrets in macOS Keychain
- block write SQL in read-only mode
- recover unsaved editor content after restart without rerunning SQL

## 28.4 Architecture Go/No-Go Gate

Proceed with full implementation only if:

- all three spikes pass their essential criteria
- Rust/Tauri development velocity is acceptable to the team
- no critical driver limitation invalidates query, cancellation, or secret-storage assumptions

If these conditions are not met, revisit:

- Tauri vs Electron
- adapter implementation strategy
- v1 feature scope reduction
