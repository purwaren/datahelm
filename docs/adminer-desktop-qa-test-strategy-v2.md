# Adminer Desktop QA and Test Strategy v2

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
- Source Data/State Model: [`adminer-desktop-data-state-model-v2.md`](/Users/purwaren/Projects/tools/adminer-desktop/docs/adminer-desktop-data-state-model-v2.md)
- Prior Version: [`adminer-desktop-qa-test-strategy.md`](/Users/purwaren/Projects/tools/adminer-desktop/docs/adminer-desktop-qa-test-strategy.md)
- Critique: [`adminer-desktop-qa-test-strategy-critique.md`](/Users/purwaren/Projects/tools/adminer-desktop/docs/adminer-desktop-qa-test-strategy-critique.md)

## 2. Purpose

This document defines the revised quality strategy and test approach for Adminer Desktop v1. It adds sharper release gates, clearer automation boundaries, stronger resilience testing, and more explicit validation structure for MVP and v1.

## 3. Revision Summary

Compared with v1, this version:

- separates feasibility validation from release validation
- adds smoke, regression, and release-candidate suite definitions
- clarifies automation boundaries by test level
- strengthens fail-closed and degraded-mode testing
- adds stronger UX validation emphasis
- makes exit criteria more operational

## 4. Quality Goals

- Core workflows must be reliable for both PostgreSQL and MySQL
- Safety controls must fail closed rather than fail open
- The app must remain usable under common failure conditions
- Local persistence and recovery must not create unsafe behavior
- UI and runtime state must remain coherent across disconnects, retries, and partial failures
- Critical UX states must remain understandable under stress and failure

## 5. Test Strategy Principles

- Prioritize end-to-end confidence for the core loop
- Test shared behavior once, then test engine-specific differences deliberately
- Treat safety and state integrity as first-class quality concerns
- Prefer deterministic fixtures over ad hoc manual environments
- Use automation for repetitive high-risk validation
- Keep manual exploratory testing for UX judgment and edge-case discovery
- Fail closed where safety behavior is uncertain

## 6. Validation Phases

## 6.1 Feasibility Validation

Purpose:

- prove the architecture and core runtime assumptions are working

Must validate:

- connection lifecycle
- secure secret handling baseline
- explorer metadata flow
- SQL execution baseline
- result rendering baseline
- row edit baseline
- read-only enforcement

## 6.2 MVP Validation

Purpose:

- prove the core user loop is stable enough for focused product usage

Must validate:

- all MVP-critical stories
- PostgreSQL and MySQL baseline parity for core flows
- core degraded-mode behavior

## 6.3 v1 Release Validation

Purpose:

- validate broader admin capabilities and release readiness

Must validate:

- schema editing
- import/export
- operations/session actions
- local persistence and recovery
- action log behavior

## 7. Test Suite Types

## 7.1 Smoke Suite

Purpose:

- fast confidence after each major change

Run frequency:

- every CI run where practical
- before merging high-risk changes

Coverage:

- app launch
- connect
- explorer load
- run SQL
- render result
- open table data

## 7.2 Regression Suite

Purpose:

- broader confidence across major workflows and edge states

Run frequency:

- scheduled CI or pre-release
- after major feature merges

Coverage:

- smoke suite plus row editing
- read-only blocking
- schema preview flow
- import/export baseline
- recovery and local storage checks

## 7.3 Release Candidate Suite

Purpose:

- final readiness validation for MVP or v1 milestone

Run frequency:

- before milestone sign-off

Coverage:

- critical PostgreSQL path
- critical MySQL path
- safety controls
- resilience and degraded-mode scenarios
- critical UX and accessibility checks

## 8. Test Levels and Automation Boundaries

## 8.1 Unit Tests

Purpose:

- validate isolated logic quickly and deterministically

Automate:

- always

Target areas:

- SQL classification logic
- safety policy evaluation
- validation rules
- normalization helpers
- retention/redaction utilities
- local storage serialization/deserialization

## 8.2 Integration Tests

Purpose:

- validate backend services with real dependencies

Automate:

- yes, in CI where stable

Use real dependencies for:

- PostgreSQL adapter
- MySQL adapter
- SQLite migrations and storage

Mock or isolate when needed:

- OS secret storage wrapper, behind controlled test doubles where direct system integration is impractical in CI

## 8.3 Component / UI Tests

Purpose:

- validate UI behavior with controlled state inputs

Automate:

- yes

Target areas:

- form validation
- state panels
- context bar badges
- confirmation dialogs
- blocked/unsupported state rendering

## 8.4 End-to-End Tests

Purpose:

- validate full workflows across frontend and backend

Automate:

- yes, but keep the suite intentionally small and stable

Priority E2E paths:

- connect and browse explorer
- run SQL and inspect results
- open table data
- insert/edit/delete baseline
- read-only blocking
- schema preview and apply baseline

## 8.5 Manual Exploratory Testing

Purpose:

- evaluate workflow coherence, message clarity, and interaction trustworthiness

Manual-first areas:

- production-safe UX clarity
- blocked and unsupported state messaging
- keyboard flow across editor, explorer, and dialogs
- long-running jobs and recovery clarity

## 9. Flakiness Prevention Rules

- use deterministic DB fixtures
- reset test databases between runs
- avoid depending on uncontrolled timing where possible
- prefer explicit waits for known state transitions
- keep E2E coverage narrow and high-value
- do not use E2E tests for logic that is better covered at unit or integration level

## 10. Traceability Model

Each significant test case should map back to:

- FRD requirement(s)
- epic/story
- engine applicability
- risk category
- milestone relevance

Recommended metadata:

- `test_id`
- `requirement_ref`
- `story_ref`
- `engine`
- `priority`
- `suite_type`
- `automation_level`
- `risk_type`
- `milestone`

## 11. Coverage Priorities

## 11.1 Feasibility-Critical Coverage

Must pass before architecture confidence is considered sufficient:

- connection create/test/save
- secure secret reference flow
- session connect
- explorer browse/open object
- SQL current-statement execution
- result rendering
- table data load
- row insert/edit/delete baseline
- read-only write blocking

## 11.2 MVP-Critical Coverage

Must pass before MVP sign-off:

- all feasibility-critical coverage
- disconnect/reconnect baseline
- production-safe confirmation baseline
- global state rendering for loading, error, disconnected, blocked

## 11.3 v1-Critical Coverage

Must pass before v1 sign-off:

- schema editing baseline
- import/export baseline
- session/process visibility
- action log
- editor recovery
- blocked and unsupported states

## 12. Risk-Based Test Areas

## 12.1 Safety Risks

High-risk areas:

- write SQL blocked incorrectly or allowed incorrectly
- destructive confirmation not enforced
- production-labeled actions too easy to execute
- action log leaking unsafe data

## 12.2 State Integrity Risks

High-risk areas:

- stale data after writes
- bad invalidation after schema changes
- broken recovery after restart
- tab/session inconsistency after disconnect

## 12.3 Engine Divergence Risks

High-risk areas:

- metadata shape differences
- cancellation differences
- session/process list differences
- schema-edit support differences

## 12.4 Persistence Risks

High-risk areas:

- corrupt local SQLite state
- missing secret references
- unbounded query history growth
- unsafe recovery state

## 12.5 Resilience and Fail-Closed Risks

High-risk areas:

- classifier uncertainty allowing unsafe execution
- secret-storage failure causing insecure fallback
- disconnected session producing misleading success state
- partial import failure producing inconsistent final state

## 13. Test Environment Matrix

## 13.1 Platform Matrix

Required for v1:

- macOS primary supported version
- one additional supported macOS version if product policy requires it

## 13.2 Engine Matrix

Required:

- PostgreSQL target version baseline
- MySQL target version baseline

Where feasible, maintain one controlled fixture DB per engine for automated testing.

## 13.3 Environment Label Matrix

Use connection labels:

- local
- development
- staging
- production

Important:

- tests validate label-driven UX and safety behavior only
- labels are not treated as environment truth

## 14. Test Data and Fixtures

## 14.1 Required Fixture Categories

- empty database
- small relational schema
- medium schema with views, indexes, and foreign keys
- writable table with primary key
- non-editable scenario
- long-running query scenario
- CSV/TSV samples
- SQL import samples

## 14.2 Reset Expectations

- fixtures must be reset between automated runs
- destructive tests must not reuse unreset databases
- import/export tests should use disposable datasets

## 15. Functional Coverage Areas

## 15.1 Connection Management

Test:

- create/edit/delete/favorite
- test connection success/failure
- invalid form handling
- secret storage success/fallback

## 15.2 Session Lifecycle

Test:

- successful connect
- disconnect
- reconnect after failure
- disconnected tab state
- capability map availability

## 15.3 Explorer

Test:

- browse objects
- open table/view
- search/filter
- lazy loading baseline
- unsupported object handling

## 15.4 SQL Editor and Results

Test:

- run current statement
- run selected SQL
- run full editor content
- success/error/warning display
- cancellation
- query history append
- result export baseline

## 15.5 Table Data and Row Editing

Test:

- open table data
- paging
- sorting/filtering
- insert row
- edit row
- delete row
- blocked writes
- relation navigation if available

## 15.6 Schema Editing

Test:

- create table
- alter table supported changes
- create/drop index
- create/drop foreign key
- create/alter view
- mandatory SQL preview
- non-transactional warning display

## 15.7 Import/Export

Test:

- SQL import success/failure
- CSV/TSV validation
- partial import failure handling
- export result set
- export table data/schema baseline

## 15.8 Operational Visibility

Test:

- runtime metadata load
- process/session list load
- kill session confirmation
- kill session success/failure

## 15.9 Persistence and Recovery

Test:

- query history retention
- editor recovery
- action log creation
- local migration behavior
- missing secret reference recovery

## 16. State and Invalidation Coverage

Explicitly validate:

- table data refresh after insert/edit/delete
- explorer/object detail refresh after schema change
- result cache disposal after session close
- row edit draft reset on tab close
- SQL draft restore after app restart

## 17. UX State and Accessibility Coverage

## 17.1 Required State Coverage

Each major surface must be validated for:

- loading
- empty
- error
- disconnected
- unsupported
- permission blocked

## 17.2 Critical UX Validation

Must be validated manually or through high-confidence scripted checks:

- destructive confirmation clarity
- read-only blocked state clarity
- production-label visibility
- success/failure message clarity

## 17.3 Accessibility and Keyboard

Minimum v1 checks:

- visible focus states
- explorer keyboard navigation
- SQL execution shortcut
- dialog focus trap and restore
- destructive confirmations understandable without color alone

## 18. Resilience and Fail-Closed Testing

The following scenarios must be tested explicitly:

- read-only mode with uncertain SQL classification
- missing keychain secret for saved profile
- local SQLite corruption or unreadable state
- disconnect during query execution
- disconnect during row save
- partial import failure
- unsupported engine capability path

Expected rule:

- when safety is uncertain, the app should block or degrade safely rather than proceed optimistically

## 19. Exit Criteria

## 19.1 Feasibility Exit Criteria

Feasibility is acceptable when:

- all feasibility-critical coverage passes on PostgreSQL and MySQL
- no unresolved blocker exists in secure secret handling, connection lifecycle, SQL execution, or row-edit baseline

## 19.2 MVP Exit Criteria

MVP is acceptable when:

- all MVP-critical coverage passes
- no known safety-control defect allows unintended write in read-only mode
- no known blocker prevents connect, query, browse, or row-edit baseline
- critical UI states have baseline coverage

## 19.3 v1 Exit Criteria

v1 is acceptable when:

- MVP is stable
- all v1-critical coverage passes
- schema editing, import/export, and action log baseline are validated
- major blocked, unsupported, and degraded-mode states are covered
- no unresolved critical defect remains in supported v1 workflows

## 20. Defect Prioritization Guidance

- `Critical`: data loss, unintended destructive action, secret exposure, core loop unusable
- `High`: major workflow broken, incorrect safety behavior, persistent state corruption
- `Medium`: degraded workflow, inconsistent state, partial feature failure with workaround
- `Low`: cosmetic issue, minor usability friction, low-risk inconsistency

## 21. Reporting and Execution Guidance

Minimum reporting outputs should include:

- smoke suite pass/fail
- regression suite pass/fail
- open critical/high defects by milestone
- requirement/story coverage status for P0 and P1 items

## 22. Recommended Next QA Artifacts

Create next:

1. detailed traceability matrix
2. smoke suite checklist
3. regression suite checklist
4. manual exploratory charters
5. engine-specific compatibility checklist

## 23. Summary

Adminer Desktop needs a QA strategy that treats safety, state integrity, engine divergence, and UX clarity as core quality pillars. This revised strategy gives the team a clearer path from feasibility proof to MVP sign-off to v1 release readiness.
