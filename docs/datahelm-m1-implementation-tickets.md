# DataHelm M1 Implementation Tickets

## 1. Document Control

- Product: DataHelm
- Milestone: `M1`
- Date: 2026-03-24
- Status: Draft
- Source Milestone Plan: [`datahelm-milestone-implementation-plan-v2.md`](/Users/purwaren/Projects/tools/adminer-desktop/docs/datahelm-milestone-implementation-plan-v2.md)
- Source Backlog: [`datahelm-epics-user-stories-v2.md`](/Users/purwaren/Projects/tools/adminer-desktop/docs/datahelm-epics-user-stories-v2.md)
- Source M0 Review: [`datahelm-m0-review.md`](/Users/purwaren/Projects/tools/adminer-desktop/docs/datahelm-m0-review.md)

## 2. Purpose

This document converts the approved `M1` scope into execution-ready implementation tickets. The goal of `M1` is to complete the MVP core loop: connect, browse, run SQL, inspect results, browse table data, and perform basic row mutation with safety signals active.

## 3. M1 Outcome Target

`M1` is complete when:

- a user can open a saved connection
- a user can see connected session context
- a user can browse explorer objects with usable navigation
- a user can run SQL and inspect results
- a user can browse table data in a dedicated workflow
- a user can insert, edit, and delete a row in a writable table
- read-only and production-safe baselines remain active

## 4. Planning Rules

- `M1` should build on `M0` baselines rather than replacing them
- avoid expanding into `v1` breadth during `M1`
- ship the simplest usable version of each core loop surface first
- keep engine parity visible in acceptance criteria

## 5. Recommended Execution Order

1. `M1-01`
2. `M1-02`
3. `M1-03`, `M1-04`
4. `M1-05`, `M1-06`
5. `M1-07`
6. `M1-08`
7. `M1-09`

## 6. Tickets

### M1-01 Session Context Bar and Workspace Framing

- Goal: make the current shell feel like a real connected workspace rather than a spike landing page
- Scope:
  - show connection name, engine, database, environment label, and read-only state persistently
  - show connected versus disconnected session state
  - show production/read-only visual cues in the shell
- Dependencies:
  - `M0` proceed decision
- Acceptance Criteria:
  - context bar is visible after connection
  - engine, profile, database, and environment are always visible
  - read-only state is visually distinct
  - disconnected state is obvious and recoverable

### M1-02 Saved Connection Workflow Polish

- Goal: turn the current connection form and saved-profile list into a repeatable connection workflow
- Scope:
  - open saved profiles directly
  - improve error state visibility during connect
  - allow editing and deleting saved profiles
  - preserve secure secret behavior
- Dependencies:
  - `M0` connection baseline
- Acceptance Criteria:
  - user can connect from a saved profile without re-entering secrets
  - edit/save flow updates the existing profile
  - delete requires confirmation
  - auth, network, and configuration failures show user-readable messages

### M1-03 Explorer Navigation Baseline

- Goal: make the explorer usable for day-to-day navigation
- Scope:
  - render explorer hierarchy from normalized metadata
  - support selection of database/schema/table/view targets
  - support refresh on demand
  - show empty and unsupported states clearly
- Dependencies:
  - `SP1-03` metadata baseline
- Acceptance Criteria:
  - user can select explorer objects from a connected session
  - the selected object is reflected in the UI
  - metadata refresh works without restarting the app
  - engine-specific hierarchy differences remain understandable

### M1-04 Object Detail and SQL Jump-Off

- Goal: connect explorer navigation to useful next actions
- Scope:
  - show object detail for a selected table or view
  - list columns and basic metadata
  - provide direct action paths to:
    - open data browser
    - open SQL workspace
- Dependencies:
  - `M1-03`
- Acceptance Criteria:
  - selected table or view shows a detail panel
  - column list is readable and stable
  - user can jump from object detail to data browsing
  - user can jump from object detail to SQL execution

### M1-05 SQL Workspace MVP Polish

- Goal: make the SQL surface usable as an MVP workspace
- Scope:
  - improve execution states and messages
  - preserve and show draft status clearly
  - support re-running current SQL predictably
  - keep read-only blocking visible and understandable
- Dependencies:
  - `SP2-01`, `SP2-02`, `SP3-03`, `SP3-04`
- Acceptance Criteria:
  - SQL workspace clearly shows idle, running, success, and failure states
  - blocked execution explains why it was blocked
  - restored draft state is visible without auto-execution
  - result notices are visible after execution

### M1-06 Data Browser Baseline

- Goal: add a dedicated table-data browsing surface separate from the generic SQL result pane
- Scope:
  - open a table data view from the explorer
  - fetch and render table rows with a constrained page size
  - support refresh and next-page behavior
  - show empty states for empty tables
- Dependencies:
  - `M1-03`
  - `M1-04`
  - current SQL/result baseline
- Acceptance Criteria:
  - user can open a dedicated data browser for a table
  - table rows render in a stable grid
  - empty tables are distinguished from failed queries
  - paging or load-more works for constrained browsing

### M1-07 Row Insert/Edit/Delete Baseline

- Goal: complete the core CRUD loop for writable tables
- Scope:
  - insert a row
  - edit a selected row
  - delete a selected row with confirmation
  - block these actions in read-only mode
- Dependencies:
  - `M1-06`
  - current safety baseline
- Acceptance Criteria:
  - user can insert a basic row into a writable table
  - user can update a selected row
  - delete requires confirmation
  - successful writes refresh affected data
  - read-only sessions block mutation attempts clearly

### M1-08 Production-Safe UX Baseline

- Goal: make trust-critical safety signals visible during normal work
- Scope:
  - production label treatment in shell and key workflows
  - stronger destructive confirmation copy
  - read-only versus writable cues
- Dependencies:
  - `M1-01`
  - `M1-07`
- Acceptance Criteria:
  - production-labeled sessions are visually distinct
  - destructive confirmations name the target object
  - mutation surfaces clearly indicate writable versus blocked context

### M1-09 M1 Demo and Evidence Pack

- Goal: close `M1` with a demoable MVP core loop package
- Scope:
  - record `M1` demo steps
  - capture smoke-test results
  - summarize unresolved blockers or caveats
- Dependencies:
  - `M1-01` through `M1-08`
- Acceptance Criteria:
  - team can demo the end-to-end MVP core loop
  - smoke-test evidence exists for PostgreSQL and MySQL
  - unresolved blockers are explicitly listed

## 7. Suggested Ownership Split

- Shell and UX framing:
  - `M1-01`, `M1-05`, `M1-08`
- Explorer and object navigation:
  - `M1-03`, `M1-04`
- Data browsing and mutation:
  - `M1-06`, `M1-07`
- Connection workflow and closeout:
  - `M1-02`, `M1-09`

## 8. Non-Goals for M1

- schema editing breadth
- import/export breadth
- process/session management UI
- advanced query cancellation UX
- action-log viewer

## 9. Summary

`M1` should not behave like a mini-`v1`. The right goal is to complete the core daily-use loop with credible trust signals and enough evidence to enter MVP stabilization cleanly.

