# DataHelm M0 Implementation Tickets

## 1. Document Control

- Product: DataHelm
- Version: v1
- Date: 2026-03-23
- Status: Draft
- Source Technical Spike Plan: [`datahelm-technical-spike-plan-v2.md`](/Users/purwaren/Projects/tools/adminer-desktop/docs/datahelm-technical-spike-plan-v2.md)
- Source Milestone Plan: [`datahelm-milestone-implementation-plan-v2.md`](/Users/purwaren/Projects/tools/adminer-desktop/docs/datahelm-milestone-implementation-plan-v2.md)
- Source Technical Design: [`datahelm-technical-design-v2.md`](/Users/purwaren/Projects/tools/adminer-desktop/docs/datahelm-technical-design-v2.md)
- Source QA Strategy: [`datahelm-qa-test-strategy-v2.md`](/Users/purwaren/Projects/tools/adminer-desktop/docs/datahelm-qa-test-strategy-v2.md)

## 2. Purpose

This document converts `M0` into the first execution-ready implementation tickets for DataHelm. The goal is to let the team run the feasibility phase with clear scope, dependencies, acceptance criteria, and evidence outputs.

## 3. How to Use This Document

- use each ticket as a Jira, Linear, or GitHub issue seed
- keep spike tickets small and decision-oriented
- do not add polish work to `M0` tickets unless it directly improves feasibility evidence
- close each spike with a short evidence artifact before moving forward

## 4. Ticket Conventions

- `M0-*`: milestone-level setup, coordination, and closeout
- `SP1-*`: connectivity and metadata spike work
- `SP2-*`: query, results, and cancellation spike work
- `SP3-*`: safety, storage, and recovery spike work
- estimates are rough and should be treated as planning guidance, not commitment

## 5. M0 Exit Condition

`M0` is complete when:

- `SP-01`, `SP-02`, and `SP-03` each have a documented outcome
- each spike is classified as `Proceed`, `Proceed with Caveats`, or `Revisit Architecture`
- roadmap and backlog assumptions are updated based on actual spike evidence

## 6. Recommended Execution Order

1. `M0-01`
2. `M0-02`
3. `SP1-01`, `SP1-02`, `SP3-01`
4. `SP1-03`, `SP3-02`
5. `SP2-01`, `SP2-02`
6. `SP2-03`, `SP2-04`, `SP3-03`, `SP3-04`
7. `SP1-04`, `SP2-05`, `SP3-05`
8. `M0-03`

## 7. Tickets

### M0-01 Repository Bootstrap for Feasibility Work

- Goal: create the minimum project structure needed to run spikes without overcommitting to production architecture
- Scope:
  - initialize the desktop app workspace
  - establish module boundaries for frontend shell, Rust commands, adapters, and local storage
  - add basic lint/test/build commands if cheap to wire
  - create a simple `spikes/` or equivalent folder strategy for evidence artifacts
- Deliverables:
  - runnable local shell baseline
  - documented workspace layout
  - basic developer commands in `README` or equivalent
- Dependencies:
  - none
- Estimate:
  - 0.5 to 1 day
- Acceptance Criteria:
  - the repository can start the desktop shell locally
  - the project structure reflects the technical design boundaries at a basic level
  - there is a designated place for spike evidence and notes

### M0-02 Shared Contracts for M0 Spikes

- Goal: define the minimum shared DTOs and interfaces so spike work does not drift into incompatible local shapes
- Scope:
  - define connection profile DTO baseline
  - define session context baseline
  - define capability map baseline
  - define metadata object baseline for explorer/detail views
  - define query job/result baseline
- Deliverables:
  - shared interface definitions
  - brief contract notes covering engine-specific optional fields
- Dependencies:
  - `M0-01`
- Estimate:
  - 0.5 day
- Acceptance Criteria:
  - all three spikes can reference the same baseline contracts
  - engine-specific differences are represented without breaking shared consumer code
  - contracts are intentionally minimal and marked as spike-level

### SP1-01 PostgreSQL Connection and Profile Validation Baseline

- Goal: prove PostgreSQL connectivity assumptions for the app runtime
- Scope:
  - load connection input/profile baseline
  - resolve secret reference if available
  - connect to PostgreSQL
  - run a simple connectivity test and return normalized session info
- Deliverables:
  - PostgreSQL connection command/service
  - sample success and failure payloads
- Dependencies:
  - `M0-01`
  - `M0-02`
- Estimate:
  - 1 day
- Acceptance Criteria:
  - PostgreSQL connect/test works with supported baseline credentials
  - failure output distinguishes auth, network, and configuration failure at a useful level
  - session info can be consumed by later spike work

### SP1-02 MySQL Connection and Profile Validation Baseline

- Goal: prove MySQL connectivity assumptions for the app runtime
- Scope:
  - load connection input/profile baseline
  - resolve secret reference if available
  - connect to MySQL
  - run a simple connectivity test and return normalized session info
- Deliverables:
  - MySQL connection command/service
  - sample success and failure payloads
- Dependencies:
  - `M0-01`
  - `M0-02`
- Estimate:
  - 1 day
- Acceptance Criteria:
  - MySQL connect/test works with supported baseline credentials
  - failure output distinguishes auth, network, and configuration failure at a useful level
  - session info can be consumed by later spike work

### SP1-03 Explorer and Object Metadata Normalization Baseline

- Goal: prove that PostgreSQL and MySQL metadata can be normalized enough for the explorer baseline
- Scope:
  - fetch database/schema/table object lists needed for the left explorer
  - fetch object detail metadata baseline for one table
  - map metadata into shared contracts
  - emit capability map fields relevant to object discovery
- Deliverables:
  - metadata fetch services for both engines
  - normalized payload examples checked into spike evidence
- Dependencies:
  - `SP1-01`
  - `SP1-02`
  - `M0-02`
- Estimate:
  - 1 to 1.5 days
- Acceptance Criteria:
  - explorer baseline metadata is returned for both engines
  - one object detail payload can be rendered from normalized data for both engines
  - known engine divergence is documented, not hidden

### SP1-04 SP-01 Evidence Pack and Recommendation

- Goal: close `SP-01` with a decision-ready evidence packet
- Scope:
  - capture demo notes
  - store example payloads
  - summarize gaps, caveats, and recommendation
- Deliverables:
  - `SP-01` report in Markdown
  - decision recommendation: `Proceed`, `Proceed with Caveats`, or `Revisit Architecture`
- Dependencies:
  - `SP1-03`
- Estimate:
  - 0.25 day
- Acceptance Criteria:
  - the report includes what worked, what failed, and open questions
  - evidence is sufficient for engineering and product review

### SP2-01 SQL Workspace Shell and Command Wiring Baseline

- Goal: create the smallest UI/runtime path for the SQL-to-results loop
- Scope:
  - open a SQL tab or equivalent shell surface
  - enter SQL text
  - submit current statement to the runtime
  - show loading, success, and failure state baseline
- Deliverables:
  - SQL editor shell baseline
  - frontend-to-runtime execution wiring
- Dependencies:
  - `M0-01`
  - `M0-02`
- Estimate:
  - 0.75 to 1 day
- Acceptance Criteria:
  - a user can type SQL and trigger execution from the app shell
  - the UI shows clear execution lifecycle states
  - the execution path works with the shared job/result contracts

### SP2-02 Query Job Tracking and Result Payload Baseline

- Goal: prove the runtime can execute SQL and return constrained results predictably
- Scope:
  - assign a job identifier to execution
  - execute the current statement for PostgreSQL and MySQL
  - capture column metadata and constrained rows
  - return structured error details when execution fails
- Deliverables:
  - runtime job abstraction baseline
  - normalized result payload examples
- Dependencies:
  - `SP2-01`
  - `SP1-01`
  - `SP1-02`
- Estimate:
  - 1 to 1.5 days
- Acceptance Criteria:
  - current-statement execution works on both engines
  - tabular results return columns and rows in a consistent structure
  - failure output can be rendered without engine-specific UI branching for the common case

### SP2-03 Constrained Results Rendering Baseline

- Goal: prove result rendering is viable without overbuilding the grid
- Scope:
  - render columns and rows from the normalized result payload
  - support a constrained result size appropriate for the spike
  - show empty and error result states
- Deliverables:
  - result table baseline in the shell
  - documented spike limits for payload size and rendering assumptions
- Dependencies:
  - `SP2-02`
- Estimate:
  - 0.5 to 1 day
- Acceptance Criteria:
  - a successful query renders readable tabular results
  - empty results are distinguishable from failed execution
  - the spike explicitly documents result-size constraints

### SP2-04 Long-Running Query and Cancellation Validation

- Goal: determine whether the cancellation model is viable enough for MVP planning
- Scope:
  - run a deliberately long query for PostgreSQL
  - run a deliberately long query for MySQL
  - attempt cancellation using the planned runtime approach
  - document what is reliable, degraded, or engine-specific
- Deliverables:
  - cancellation notes for both engines
  - recommendation for MVP behavior and caveats
- Dependencies:
  - `SP2-02`
- Estimate:
  - 0.5 to 1 day
- Acceptance Criteria:
  - PostgreSQL cancellation behavior is demonstrated and documented
  - MySQL cancellation approach is either demonstrated or clearly bounded with a practical fallback plan
  - risk to the MVP query loop is explicitly stated

### SP2-05 SP-02 Evidence Pack and Recommendation

- Goal: close `SP-02` with decision evidence
- Scope:
  - summarize execution and rendering outcomes
  - summarize cancellation outcomes
  - record caveats and recommendation
- Deliverables:
  - `SP-02` report in Markdown
  - decision recommendation
- Dependencies:
  - `SP2-03`
  - `SP2-04`
- Estimate:
  - 0.25 day
- Acceptance Criteria:
  - the report captures both engines separately where needed
  - the recommendation is explicit enough to drive `M1` planning

### SP3-01 Local App Database and Migration Baseline

- Goal: prove the local persistence model can support `MVP` and `v1` state safely
- Scope:
  - create SQLite app database baseline
  - define initial schema for connection profiles, draft state, and action log baseline
  - add migration bootstrap path
- Deliverables:
  - local SQLite initialization and migration baseline
  - schema notes for retained entities
- Dependencies:
  - `M0-01`
  - `M0-02`
- Estimate:
  - 0.75 day
- Acceptance Criteria:
  - the app can initialize the local database without manual setup
  - schema versioning or migration strategy exists at a basic level
  - plaintext password storage is not required by the schema

### SP3-02 Keychain Secret Reference Flow

- Goal: prove that credentials can be stored securely without plain SQLite secrets
- Scope:
  - store a secret in the platform keychain
  - persist only a non-secret reference in app storage
  - resolve the secret at connection time
  - handle missing or invalid secret references
- Deliverables:
  - keychain integration baseline
  - secret reference flow notes
- Dependencies:
  - `SP3-01`
  - `SP1-01` or `SP1-02`
- Estimate:
  - 1 day
- Acceptance Criteria:
  - secrets are not persisted in plain SQLite
  - connection flow can resolve a valid secret reference
  - missing keychain data fails safely with a usable error

### SP3-03 Read-Only SQL Classification and Fail-Closed Blocking

- Goal: prove the product can prevent obvious writes in read-only mode
- Scope:
  - define spike-level SQL classification rules for write and DDL operations
  - block known write operations before execution when read-only mode is active
  - log blocked execution attempts in the minimal action log path
- Deliverables:
  - read-only classifier baseline
  - blocked execution demo notes
- Dependencies:
  - `SP2-01`
  - `SP2-02`
  - `SP3-01`
- Estimate:
  - 1 day
- Acceptance Criteria:
  - known write and DDL statements are blocked in read-only mode
  - uncertain statements fail closed during the spike unless explicitly allowed
  - the UI can explain that execution was blocked for safety

### SP3-04 Editor Draft Persistence and Restore Baseline

- Goal: prove unsaved SQL can survive restart without accidental execution
- Scope:
  - persist unsaved SQL draft state locally
  - restore draft on reopen or relaunch
  - ensure restore does not execute the draft
- Deliverables:
  - draft persistence baseline
  - restore demo notes
- Dependencies:
  - `SP2-01`
  - `SP3-01`
- Estimate:
  - 0.5 day
- Acceptance Criteria:
  - an unsaved SQL draft is restored after restart or simulated relaunch
  - restore preserves text only and does not trigger execution
  - the restored state is visible to the user

### SP3-05 Minimal Action Log Baseline and SP-03 Evidence Pack

- Goal: close `SP-03` with a minimal audit trail and decision-ready evidence
- Scope:
  - store minimal log events for blocked write attempts and critical safety actions
  - capture keychain, read-only, and draft-restore outcomes
  - produce the final `SP-03` recommendation
- Deliverables:
  - minimal action-log baseline
  - `SP-03` report in Markdown
  - decision recommendation
- Dependencies:
  - `SP3-02`
  - `SP3-03`
  - `SP3-04`
- Estimate:
  - 0.5 day
- Acceptance Criteria:
  - minimal safety-relevant events can be recorded without secret leakage
  - the report captures pass/fail evidence and caveats
  - the report clearly states whether the architecture is safe enough to continue

### M0-03 Milestone Review and Post-Spike Plan Update

- Goal: turn spike outputs into a clear go/no-go recommendation and planning update
- Scope:
  - review `SP-01`, `SP-02`, and `SP-03` outcomes together
  - classify `M0` as proceed, proceed with caveats, or revisit architecture
  - update backlog, roadmap, and technical assumptions as needed
- Deliverables:
  - `M0` review summary
  - list of changes required for `M1`
- Dependencies:
  - `SP1-04`
  - `SP2-05`
  - `SP3-05`
- Estimate:
  - 0.25 to 0.5 day
- Acceptance Criteria:
  - the milestone has a recorded go/no-go recommendation
  - caveats are converted into backlog or roadmap changes
  - `M1` start conditions are either confirmed or explicitly blocked

## 8. Suggested Ownership Split

- App shell and shared contracts:
  - `M0-01`, `M0-02`, `SP2-01`
- Database runtime and adapters:
  - `SP1-01`, `SP1-02`, `SP1-03`, `SP2-02`, `SP2-04`
- Safety and persistence:
  - `SP3-01`, `SP3-02`, `SP3-03`, `SP3-04`, `SP3-05`
- Milestone coordination:
  - `SP1-04`, `SP2-05`, `M0-03`

## 9. Notes for Ticket Conversion

- if your tracker supports epics, place all of these under `M0 Feasibility Validation`
- tag `SP1-*`, `SP2-*`, and `SP3-*` tickets to preserve traceability to the spike plan
- create separate sub-tasks only when a ticket cannot be completed in roughly 0.5 to 1.5 focused days

## 10. Summary

These tickets are meant to get DataHelm through the shortest responsible feasibility loop: prove connectivity, prove the SQL/results path, prove safety and local persistence, then use real evidence to decide whether `M1` should begin unchanged, begin with caveats, or pause for an architecture adjustment.
