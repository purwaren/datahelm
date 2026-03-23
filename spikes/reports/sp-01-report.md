# SP-01 Report: Connectivity and Metadata

## 1. Summary

- Spike: `SP-01`
- Product: DataHelm
- Date: 2026-03-24
- Outcome: `Proceed with Caveats`

Core question:

- Can the app connect to PostgreSQL and MySQL and return enough normalized metadata for the explorer and object detail baseline?

Short answer:

- Yes, the architecture is viable and the adapter boundary is working.
- The implementation is strong enough to continue into `M1`.
- The remaining caveat is that the evidence is currently based on verified build/runtime paths and code-level implementation, not a fully captured dual-engine manual demo artifact against known live fixtures.

## 2. Scope Completed

Implemented in this spike:

- PostgreSQL connection baseline
- MySQL connection baseline
- saved profile load path
- keychain-backed secret reference resolution
- session and capability map emission
- normalized explorer metadata baseline
- normalized object detail metadata baseline

Primary implementation files:

- [`src-tauri/src/adapters/postgres.rs`](/Users/purwaren/Projects/tools/adminer-desktop/src-tauri/src/adapters/postgres.rs)
- [`src-tauri/src/adapters/mysql.rs`](/Users/purwaren/Projects/tools/adminer-desktop/src-tauri/src/adapters/mysql.rs)
- [`src-tauri/src/commands/mod.rs`](/Users/purwaren/Projects/tools/adminer-desktop/src-tauri/src/commands/mod.rs)
- [`src-tauri/src/persistence/mod.rs`](/Users/purwaren/Projects/tools/adminer-desktop/src-tauri/src/persistence/mod.rs)
- [`src-tauri/src/secret_store.rs`](/Users/purwaren/Projects/tools/adminer-desktop/src-tauri/src/secret_store.rs)
- [`src/app/App.tsx`](/Users/purwaren/Projects/tools/adminer-desktop/src/app/App.tsx)

## 3. Evidence Collected

Implementation evidence:

- typed request/response contracts exist for connection tests and metadata fetches
- PostgreSQL and MySQL have separate adapter implementations behind one shared interface
- connection requests can resolve passwords either directly or through saved keychain references
- the shell can:
  - test a connection
  - save a profile
  - list saved profiles
  - fetch explorer/detail metadata

Verification evidence:

- `cargo check --manifest-path src-tauri/Cargo.toml`
- `npm run typecheck`
- `npm run build`

Normalized metadata coverage:

- PostgreSQL:
  - database list
  - schema list
  - table/view list
  - column detail for one target object
- MySQL:
  - database list
  - table/view list
  - column detail for one target object

## 4. What Worked

- The adapter split is appropriate for PostgreSQL/MySQL divergence.
- The shared contracts are sufficient for the current explorer baseline.
- Metadata normalization is practical for:
  - database
  - schema
  - table
  - view
  - column detail
- Keychain-backed profile storage integrates with the connection path without exposing plaintext secrets to SQLite.

## 5. Gaps and Caveats

- The spike does not yet include a checked-in evidence payload set under `spikes/payloads/`.
- The project has not yet captured a full manual demo transcript against both live engines with known fixtures.
- Capability maps are still baseline-level and not yet exhaustive.
- Richer metadata such as:
  - indexes
  - constraints
  - foreign-key detail
  - process/session introspection
  are still outside this spike’s normalized payload scope.

## 6. Recommendation

Recommendation:

- `Proceed with Caveats`

Reasoning:

- There is no architectural blocker in connectivity or metadata normalization.
- The remaining gaps are evidence completeness and metadata breadth, not viability.

## 7. Roadmap Impact

- `M1` can proceed.
- Explorer scope for `M1` should stay disciplined:
  - use the current normalized baseline first
  - defer deeper metadata breadth until required by the MVP flow
- Add a short manual validation pass against live PostgreSQL and MySQL fixtures before claiming `SP-01` fully closed for external stakeholder review.

## 8. Follow-Up Actions

- capture example metadata payloads for both engines under `spikes/payloads/`
- run live validation against one PostgreSQL fixture and one MySQL fixture
- document any engine-specific metadata gaps discovered in that validation

