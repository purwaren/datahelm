# SP-03 Report: Safety, Storage, and Recovery

## 1. Summary

- Spike: `SP-03`
- Product: DataHelm
- Date: 2026-03-24
- Outcome: `Proceed with Caveats`

Core question:

- Can the product enforce read-only behavior safely and store local state without exposing secrets?

Short answer:

- Yes, the chosen approach is viable.
- The current baseline demonstrates the intended architecture:
  - SQLite for app state
  - macOS Keychain for secrets
  - fail-closed read-only blocking
  - SQL draft persistence and restore

## 2. Scope Completed

Implemented in this spike:

- SQLite app DB initialization
- local schema migration baseline
- connection profile persistence
- keychain-backed secret storage and lookup
- read-only SQL classification and blocking
- minimal action log append path
- editor draft save and restore

Primary implementation files:

- [`src-tauri/src/persistence/mod.rs`](/Users/purwaren/Projects/tools/adminer-desktop/src-tauri/src/persistence/mod.rs)
- [`src-tauri/src/secret_store.rs`](/Users/purwaren/Projects/tools/adminer-desktop/src-tauri/src/secret_store.rs)
- [`src-tauri/src/safety.rs`](/Users/purwaren/Projects/tools/adminer-desktop/src-tauri/src/safety.rs)
- [`src-tauri/src/commands/mod.rs`](/Users/purwaren/Projects/tools/adminer-desktop/src-tauri/src/commands/mod.rs)
- [`src/app/App.tsx`](/Users/purwaren/Projects/tools/adminer-desktop/src/app/App.tsx)

## 3. Evidence Collected

Implementation evidence:

- SQLite stores profile records with `secret_ref`, not plaintext password
- macOS Keychain storage uses `/usr/bin/security`
- read-only SQL is blocked before execution based on a backend classifier
- blocked actions are recorded in the minimal action log
- SQL draft state is saved and restored through persisted local storage

Verification evidence:

- `cargo check --manifest-path src-tauri/Cargo.toml`
- `npm run typecheck`
- `npm run build`

## 4. What Worked

- The local persistence model is compatible with the planned state model.
- Secret storage is separated from SQLite as intended.
- Safety enforcement lives in the backend rather than only in the UI.
- Draft restore works as state recovery, not automatic replay.

## 5. Gaps and Caveats

- The current implementation is macOS-oriented and uses the native `security` CLI.
- The minimal action log exists, but there is no action-log viewer yet.
- The SQL classifier is intentionally conservative and not yet exhaustive.
- The spike still needs live validation for:
  - keychain permission behavior on a real user session
  - blocked-write demonstrations against live DBs
  - restart/reopen draft recovery confirmation in desktop runtime

## 6. Recommendation

Recommendation:

- `Proceed with Caveats`

Reasoning:

- There is no sign that the architecture is unsafe by design.
- The remaining work is operational hardening and completeness, not conceptual risk.

## 7. Roadmap Impact

- `M1` can continue with the current security/storage model.
- Read-only mode should remain backend-enforced.
- The current classifier should be treated as a baseline and expanded carefully rather than relaxed.

## 8. Follow-Up Actions

- capture a live blocked-write demo for both engines
- capture a live draft-restore demo after app restart
- record one saved-profile/keychain lookup example in spike evidence

