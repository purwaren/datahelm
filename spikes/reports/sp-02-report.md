# SP-02 Report: Query, Results, and Cancellation

## 1. Summary

- Spike: `SP-02`
- Product: DataHelm
- Date: 2026-03-24
- Outcome: `Proceed with Caveats`

Core question:

- Can the runtime support the SQL-to-results loop and cancellation behavior needed for MVP?

Short answer:

- Yes for the query/results loop.
- Mostly yes for cancellation, but the current implementation is a probe baseline rather than a polished generic cancellation system.

## 2. Scope Completed

Implemented in this spike:

- SQL workspace shell baseline
- current-statement execution path
- job/result payload baseline
- constrained row-returning result rendering
- affected-row handling for non-row statements
- cancellation probe path for PostgreSQL and MySQL

Primary implementation files:

- [`src-tauri/src/adapters/postgres.rs`](/Users/purwaren/Projects/tools/adminer-desktop/src-tauri/src/adapters/postgres.rs)
- [`src-tauri/src/adapters/mysql.rs`](/Users/purwaren/Projects/tools/adminer-desktop/src-tauri/src/adapters/mysql.rs)
- [`src-tauri/src/runtime/mod.rs`](/Users/purwaren/Projects/tools/adminer-desktop/src-tauri/src/runtime/mod.rs)
- [`src-tauri/src/commands/mod.rs`](/Users/purwaren/Projects/tools/adminer-desktop/src-tauri/src/commands/mod.rs)
- [`src/app/App.tsx`](/Users/purwaren/Projects/tools/adminer-desktop/src/app/App.tsx)

## 3. Evidence Collected

Implementation evidence:

- the frontend can submit SQL through a typed Tauri bridge
- the backend returns:
  - job metadata
  - column metadata
  - row data
  - row count
  - affected rows for non-row statements
  - notices
- result sets are constrained with a baseline `rowLimit`
- cancellation probe commands exist for both engines:
  - PostgreSQL via `pg_cancel_backend`
  - MySQL via `KILL QUERY`

Verification evidence:

- `cargo check --manifest-path src-tauri/Cargo.toml`
- `npm run typecheck`
- `npm run build`

## 4. What Worked

- The SQL-to-results loop is architecturally viable.
- A single shared payload shape works for both engines in the baseline case.
- The current UI is sufficient to validate:
  - execution lifecycle
  - row-returning queries
  - non-row statements
  - constrained rendering
- Cancellation can be probed with engine-specific strategies without breaking the shared application model.

## 5. Gaps and Caveats

- The current SQL surface is still a spike shell, not a polished editor.
- Cancellation is implemented as a dedicated probe path, not as full per-job user cancellation for arbitrary running queries.
- The result coercion layer is intentionally simple and will need refinement for richer data types.
- The current scope does not yet cover:
  - multi-tab SQL ergonomics
  - selection execution
  - streaming very large result sets
  - final cancellation UX

## 6. Recommendation

Recommendation:

- `Proceed with Caveats`

Reasoning:

- The main architecture question is answered positively.
- The caveats are about depth and polish, not whether the model works.

## 7. Roadmap Impact

- `M1` can use the current execution/result loop as the baseline.
- Cancellation should remain a controlled `P1` / refinement area in implementation sequencing.
- Result rendering should stay constrained rather than expanding into spreadsheet behavior too early.

## 8. Follow-Up Actions

- capture example SQL result payloads under `spikes/payloads/`
- run cancellation probe validation against real PostgreSQL and MySQL fixtures
- document the exact observed cancellation behavior and user-facing limitations

