# DataHelm Delivery Roadmap v2

## 1. Document Control

- Product: DataHelm
- Version: v2
- Date: 2026-03-23
- Status: Revised Draft
- Source BRD: [`datahelm-brd-v2.md`](/Users/purwaren/Projects/tools/adminer-desktop/docs/datahelm-brd-v2.md)
- Source FRD: [`datahelm-frd-v2.md`](/Users/purwaren/Projects/tools/adminer-desktop/docs/datahelm-frd-v2.md)
- Source Technical Design: [`datahelm-technical-design-v2.md`](/Users/purwaren/Projects/tools/adminer-desktop/docs/datahelm-technical-design-v2.md)
- Source UX Spec: [`datahelm-ux-spec-wireflow-v2.md`](/Users/purwaren/Projects/tools/adminer-desktop/docs/datahelm-ux-spec-wireflow-v2.md)
- Source Backlog: [`datahelm-epics-user-stories-v2.md`](/Users/purwaren/Projects/tools/adminer-desktop/docs/datahelm-epics-user-stories-v2.md)
- Source Data/State Model: [`datahelm-data-state-model-v2.md`](/Users/purwaren/Projects/tools/adminer-desktop/docs/datahelm-data-state-model-v2.md)
- Source QA Strategy: [`datahelm-qa-test-strategy-v2.md`](/Users/purwaren/Projects/tools/adminer-desktop/docs/datahelm-qa-test-strategy-v2.md)

## 2. Purpose

This document defines the revised milestone-based delivery roadmap for DataHelm. It sharpens phase boundaries, clarifies blocking versus parallel work, strengthens release-gate evidence, and makes milestone outputs easier to understand for both delivery teams and stakeholders.

## 3. Revision Summary

Compared with v1, this version:

- adds explicit phase non-goals
- distinguishes blocking work from parallelizable work
- adds complexity bands for each phase
- strengthens gate evidence and sign-off expectations
- pulls trust-critical UX work earlier
- adds clearer milestone demo outcomes

## 4. Roadmap Goals

- prove technical feasibility early
- ship a narrow but credible MVP
- expand to a practical v1 admin workbench without losing discipline
- keep safety, UX trust, and quality visible throughout delivery

## 5. Roadmap Assumptions

- macOS is the only required launch platform for v1
- PostgreSQL and MySQL are the only supported engines for v1
- work follows the revised technical design and revised backlog
- non-essential ergonomics should not displace MVP-critical delivery

## 6. Phase Overview

| Phase | Name | Complexity | Main Outcome |
|---|---|---|---|
| P0 | Foundations and Technical Spikes | High | Feasibility decision |
| P1 | MVP Core Loop | High | Core product loop feature-complete |
| P2 | MVP Hardening and Sign-off | Medium | Stable MVP |
| P3 | v1 Expansion Features | High | Practical admin workbench feature-complete |
| P4 | v1 Hardening and Release Readiness | Medium | v1 release candidate |
| P5 | v1.1 Improvements | Medium | Post-launch polish and depth |

## 7. Phase 0: Foundations and Technical Spikes

### Objective

Validate the architecture before full implementation commitment.

### In Scope

- repository and CI baseline
- app shell skeleton
- PostgreSQL/MySQL connection spike
- metadata spike
- SQL execution spike
- result rendering spike
- secret storage spike
- read-only safety spike

### Non-Goals

- polished UX
- full explorer
- full row editing
- schema editing implementation
- import/export implementation

### Blocking Work

- driver validation
- secure secret storage validation
- query execution path validation
- read-only enforcement validation

### Parallelizable Work

- repository scaffolding
- shell scaffolding
- trace logging baseline
- basic UI shell experiments

### Demo Outcome

- connect to PostgreSQL and MySQL
- fetch basic metadata
- run SQL and render results
- demonstrate read-only blocking

### Exit Evidence

- spike pass/fail reports
- architecture go/no-go decision
- identified fallback decisions if any

### Sign-Off

- engineering lead
- product lead

## 8. Phase 1: MVP Core Loop

### Objective

Deliver the first usable product loop:

- connect
- explore
- query
- browse data
- perform basic row mutation safely

### In Scope

- startup and connection flow
- context bar and session context
- explorer baseline
- SQL editor baseline
- results grid baseline
- table data browsing
- insert/edit/delete baseline
- read-only enforcement
- production-safe confirmation baseline
- trust-critical blocked/error states

### Non-Goals

- schema editing
- import/export
- session/process operations
- advanced workspace ergonomics
- polished history/recovery

### Blocking Work

- session lifecycle stability
- explorer/object opening
- SQL execution baseline
- results rendering baseline
- row mutation baseline
- read-only and confirmation baseline

### Parallelizable Work

- shell UX refinement
- basic blocked/unsupported state rendering
- core smoke-suite automation

### Demo Outcome

- a user creates or opens a connection, browses a table, runs SQL, inspects results, edits a row, and sees safety guardrails working

### Exit Evidence

- MVP success gate from backlog passes
- MVP-critical QA coverage passes
- no critical safety-control defects remain

### Sign-Off

- engineering lead
- product lead
- QA owner

## 9. Phase 2: MVP Hardening and Sign-off

### Objective

Stabilize the MVP before widening scope.

### In Scope

- defect fixing
- disconnect/reconnect behavior
- state integrity fixes
- keyboard/accessibility baseline
- blocked/unsupported state improvements
- smoke and regression stabilization

### Non-Goals

- new major feature domains
- broad admin expansion

### Blocking Work

- defect burn-down
- resilience fixes
- MVP gate evidence completion

### Parallelizable Work

- minor UX refinements
- onboarding/help copy improvements

### Demo Outcome

- stable MVP candidate with repeatable core-loop demos on both engines

### Exit Evidence

- MVP exit criteria from QA strategy pass
- critical and high defects resolved or explicitly accepted
- smoke suite stable

### Sign-Off

- engineering lead
- product lead
- QA owner

## 10. Phase 3: v1 Expansion Features

### Objective

Turn the MVP into the first practical admin workbench release.

### In Scope

- schema editing baseline
- import/export baseline
- session/process visibility
- runtime metadata
- action log
- editor recovery

### Non-Goals

- routine/trigger/event authoring
- privilege management
- schema diagrams
- Linux support

### Blocking Work

- schema edit flows and SQL preview
- import/export execution paths
- persistence and recovery features

### Parallelizable Work

- process/session UX
- metadata panels
- action log UI or inspection surfaces if added

### Demo Outcome

- a user can safely preview and apply supported schema changes, import/export data, inspect sessions, and recover SQL drafts

### Exit Evidence

- v1-critical backlog stories implemented
- v1-critical QA coverage passes at baseline
- no unresolved critical defects in schema editing or import/export baseline

### Sign-Off

- engineering lead
- product lead
- QA owner

## 11. Phase 4: v1 Hardening and Release Readiness

### Objective

Prepare the first practical release for distribution.

### In Scope

- defect fixing
- cross-feature regression validation
- release-candidate suite
- packaging and notarization
- onboarding and install-path polish

### Non-Goals

- new feature domains
- large UX redesigns
- Windows shipping commitment

### Blocking Work

- release candidate build
- packaging validation
- release-candidate QA

### Parallelizable Work

- release notes
- documentation
- final support/diagnostic guidance

### Demo Outcome

- signed and notarized release-candidate build with validated install and first-run flow

### Exit Evidence

- v1 exit criteria from QA strategy pass
- no unresolved critical defects remain
- release-candidate suite passes

### Sign-Off

- engineering lead
- product lead
- QA owner

## 12. Phase 5: v1.1 Improvements

### Objective

Improve ergonomics and depth after the first stable release.

### In Scope

- richer blocked/unsupported state handling
- stronger keyboard ergonomics
- improved workspace/history ergonomics
- limited guided maintenance expansion if still aligned

### Non-Goals

- strategic product pivot
- new database engines

### Demo Outcome

- existing users can move faster and recover from edge conditions more gracefully without changing the product’s core shape

## 13. Milestone Summary

| Milestone | Internal Meaning | Stakeholder Meaning |
|---|---|---|
| M0 | Feasibility validated | Architecture is viable |
| M1 | MVP core loop complete | Product basics are demoable |
| M2 | MVP stable | Core loop is credible and testable |
| M3 | v1 features complete | Practical admin workflows are present |
| M4 | v1 release-ready | First release candidate is ready |
| M5 | v1.1 complete | First improvement cycle shipped |

## 14. Workstream Guidance

Suggested workstreams after P0:

- Workstream A: shell, explorer, and UX state
- Workstream B: connection/session/security/runtime
- Workstream C: SQL/results/data workflows
- Workstream D: persistence/import-export/release hardening

### High-Risk Dependency Chains

- secure storage -> session open -> query execution
- session runtime -> explorer -> table data -> row mutation
- SQL preview -> schema editing -> metadata invalidation
- local SQLite stability -> recovery/action log/history

## 15. Quality Gates by Phase

### P0

- feasibility-critical tests pass

### P1

- smoke suite covers core loop
- trust-critical UX is reviewable and acceptable

### P2

- MVP exit criteria pass

### P3

- v1-critical functional coverage reaches acceptable baseline

### P4

- release-candidate suite passes
- packaging/install checks pass

### P5

- improvement work does not regress v1 stability

## 16. Trust-Critical UX Work Placement

These UX areas are not “late polish” and must be handled by MVP phases:

- production label visibility
- read-only clarity
- destructive confirmation clarity
- blocked and unsupported state clarity
- error message usefulness for core flows

## 17. Deferral Rules

Move work to the next phase if:

- it does not contribute directly to the current phase exit criteria
- it adds meaningful complexity without improving current milestone confidence
- it depends on unstable infrastructure not yet proven

Examples:

- move workspace ergonomics from MVP to v1.1
- move advanced export breadth from v1 to v1.1 if baseline export is already acceptable

## 18. Major Risks Across the Roadmap

- Tauri/Rust delivery friction may slow early progress
- data-grid scope may expand unexpectedly
- PostgreSQL/MySQL parity may consume more effort than expected
- safety edge cases may require deeper implementation than planned
- packaging and notarization may create late-stage friction

## 19. Mitigation Strategy

- keep P0 narrow and honest
- keep MVP focused on the core loop
- continuously validate both engines, not only near release
- keep trust-critical UX early
- preserve a dedicated hardening phase before release

## 20. Recommended Next Artifacts

After this roadmap, the most useful follow-up artifacts are:

1. milestone implementation plan
2. engineering ticket breakdown by wave
3. traceability matrix connecting roadmap, backlog, and QA coverage

## 21. Summary

This revised roadmap is designed to keep DataHelm disciplined and demoable:

- prove the architecture first
- ship the narrow core loop second
- stabilize before expansion
- harden before release

That sequence gives the team the best chance of delivering a useful, safe, and credible first release without losing focus or overcommitting too early.
