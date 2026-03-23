# DataHelm Live Validation Checklist

## 1. Purpose

This checklist is a short smoke-validation guide for running DataHelm against live PostgreSQL and MySQL instances. It is intended to close the remaining `M0` evidence gaps and support early `M1` verification.

## 2. Preconditions

Before running the checklist:

- start the desktop app with `npm run tauri dev`
- ensure one PostgreSQL instance is reachable
- ensure one MySQL instance is reachable
- prepare one writable test database for each engine
- prepare one read-only test profile for each engine if possible

## 3. PostgreSQL Smoke Checklist

- save a PostgreSQL connection profile
- test the PostgreSQL connection successfully
- reopen the saved PostgreSQL profile and connect again
- fetch explorer metadata successfully
- select a table or view and confirm column detail loads
- run a simple row-returning query such as `select current_database()`
- run a non-row statement in a writable test context and confirm completion
- confirm the SQL result surface shows rows or affected-row feedback correctly
- enable or use a read-only PostgreSQL profile and confirm:
  - `select` succeeds
  - `insert`, `update`, or `delete` is blocked before execution
- type SQL in the editor, restart the app, and confirm the draft restores without executing
- run the PostgreSQL cancellation probe and record:
  - whether cancellation completed
  - the observed error message if any

## 4. MySQL Smoke Checklist

- save a MySQL connection profile
- test the MySQL connection successfully
- reopen the saved MySQL profile and connect again
- fetch explorer metadata successfully
- select a table or view and confirm column detail loads
- run a simple row-returning query such as `select database()`
- run a non-row statement in a writable test context and confirm completion
- confirm the SQL result surface shows rows or affected-row feedback correctly
- enable or use a read-only MySQL profile and confirm:
  - `select` succeeds
  - `insert`, `update`, or `delete` is blocked before execution
- type SQL in the editor, restart the app, and confirm the draft restores without executing
- run the MySQL cancellation probe and record:
  - whether cancellation completed
  - the observed error message if any

## 5. Shared Failures to Watch For

- auth failure messages are too vague
- connection errors do not distinguish host/port from credential problems
- metadata rendering differs so much between engines that navigation becomes confusing
- read-only mode permits a write or DDL statement
- draft restore triggers automatic execution
- saved profiles lose their keychain secret reference
- cancellation probe hangs the app shell or leaves the session in a broken state

## 6. Evidence to Capture

Capture the following for both engines:

- one successful connection screenshot
- one metadata view screenshot
- one successful SQL result screenshot
- one blocked read-only write attempt screenshot
- one restored draft screenshot
- one cancellation probe outcome note

Suggested storage:

- `spikes/notes/`
- `spikes/payloads/`
- or the next milestone evidence folder if the team creates one

## 7. Exit Signal

The checklist is considered passed when:

- PostgreSQL and MySQL both complete the core smoke path
- no blocker appears in connect, metadata, SQL execution, or read-only blocking
- any caveats are documented clearly enough to inform the next implementation wave

