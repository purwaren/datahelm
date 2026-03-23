# DataHelm Technical Spike Plan v2

## 1. Document Control

- Product: DataHelm
- Version: v2
- Date: 2026-03-23
- Status: Revised Draft
- Source Technical Design: [`datahelm-technical-design-v2.md`](/Users/purwaren/Projects/tools/adminer-desktop/docs/datahelm-technical-design-v2.md)
- Source Roadmap: [`datahelm-delivery-roadmap-v2.md`](/Users/purwaren/Projects/tools/adminer-desktop/docs/datahelm-delivery-roadmap-v2.md)
- Source QA Strategy: [`datahelm-qa-test-strategy-v2.md`](/Users/purwaren/Projects/tools/adminer-desktop/docs/datahelm-qa-test-strategy-v2.md)

## 2. Purpose

This revised spike plan narrows the feasibility work to decision-oriented proofs, clarifies evidence requirements, and defines how spike outcomes drive roadmap decisions.

## 3. Spike Rules

- each spike must answer one primary architecture question
- spike code may be disposable unless explicitly promoted
- do not build production-grade polish during spike work
- if a spike cannot answer its core question within the timebox, mark it inconclusive rather than stretching indefinitely

## 4. Spike Inventory

| Spike ID | Name | Primary Decision |
|---|---|---|
| SP-01 | Connectivity and Metadata | Are PostgreSQL/MySQL connection and metadata assumptions valid enough to continue? |
| SP-02 | Query, Results, and Cancellation | Is the query/results execution model viable for the core loop? |
| SP-03 | Safety, Storage, and Recovery | Are secret handling, read-only enforcement, and local recovery safe enough to continue? |

## 5. Scope Boundaries

## 5.1 Reuse vs Disposal Guidance

- adapter code and shell wiring may be retained if clean enough
- throwaway UI scaffolding is acceptable
- no spike should try to produce final UX polish

## 5.2 Timebox Guidance

- SP-01: 2-4 focused days
- SP-02: 3-5 focused days
- SP-03: 2-4 focused days

## 5.3 Checkpoint Rhythm

- daily checkpoint during active spike work
- end-of-spike summary required

## 6. SP-01 Connectivity and Metadata

### Core Question

Can the app connect to PostgreSQL and MySQL and return enough normalized metadata for the explorer and object detail baseline?

### In Scope

- saved profile load
- secret resolution
- PostgreSQL connect/test
- MySQL connect/test
- fetch explorer metadata baseline
- fetch object detail metadata baseline
- capability map emission

### Out of Scope

- polished explorer UX
- schema editing
- import/export
- process list

### Required Evidence

- working demo for both engines
- example normalized payloads
- note on metadata gaps or divergence

### Pass Criteria

- both engines connect successfully with supported credentials
- explorer/detail baseline metadata is retrievable
- capability map can be generated per session

### Failure Criteria

- one engine cannot connect reliably
- metadata normalization is too inconsistent for practical UI use

## 7. SP-02 Query, Results, and Cancellation

### Core Question

Can the runtime support the SQL-to-results loop and cancellation behavior needed for MVP?

### In Scope

- open SQL tab baseline
- run current statement
- run selected/full SQL baseline if cheap to prove
- render constrained result grid
- job tracking baseline
- long-running query and cancel test

### Out of Scope

- polished multi-tab ergonomics
- full data-grid editing behavior
- export breadth

### Required Evidence

- working SQL execution demo on both engines
- result payload examples
- cancellation notes for PostgreSQL and MySQL

### Pass Criteria

- current-statement execution works on both engines
- tabular result rendering is viable
- PostgreSQL cancellation is usable
- MySQL cancellation path is understood well enough to plan around

### Inconclusive Criteria

- execution works but cancellation or result handling has unresolved ambiguity that requires one follow-up experiment

### Failure Criteria

- query/results loop is unstable
- result handling is too heavy or too coupled

## 8. SP-03 Safety, Storage, and Recovery

### Core Question

Can the product enforce read-only behavior safely and store local state without exposing secrets?

### In Scope

- SQLite app DB baseline
- keychain secret reference flow
- read-only SQL blocking baseline
- editor draft persistence and restore
- minimal action-log baseline

### Out of Scope

- full history retention policy UI
- advanced diagnostics export
- production-ready action-log viewing interface

### Required Evidence

- keychain-backed secret lookup demo
- read-only blocked-write demo
- SQL draft restore demo

### Pass Criteria

- secrets are not stored in plain SQLite
- read-only mode blocks known write/DDL SQL
- unsaved SQL restores without execution

### Failure Criteria

- secure secret storage cannot be integrated acceptably
- read-only mode does not fail closed

Important:

- insecure secret fallback without explicit approved design counts as failure, not caveat

## 9. Decision Ownership

- engineering lead evaluates technical viability
- product lead evaluates scope and roadmap implications
- security-conscious reviewer or designated lead evaluates SP-03 outcomes

## 10. Spike Outcomes and Roadmap Impact

- `Proceed`: roadmap continues largely unchanged
- `Proceed with Caveats`: roadmap updated with scope reductions or technical constraints
- `Revisit Architecture`: pause roadmap advancement until architectural decision is changed

After each spike:

- update risks
- update roadmap assumptions
- update backlog scope if needed

## 11. End-of-Spike Report Template

- question asked
- prototype scope
- what worked
- what failed
- open questions
- decision recommendation
- roadmap implication

## 12. Summary

This revised spike plan keeps the feasibility phase disciplined: answer the hard questions quickly, gather concrete evidence, and let those results shape the roadmap before the team overinvests.
