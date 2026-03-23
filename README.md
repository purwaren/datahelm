# DataHelm

DataHelm is a desktop database workbench focused on PostgreSQL and MySQL.

This repository currently contains:

- the product planning package under [`docs/`](./docs)
- the `M0` feasibility workspace scaffold
- shared spike contracts for the frontend and Rust backend

## Workspace Layout

- `src/`: React + TypeScript frontend shell
- `src-tauri/`: Rust backend, Tauri app shell, and runtime modules
- `spikes/`: evidence artifacts and spike reports
- `docs/`: retained planning and delivery documents

## M0 Goals

The current implementation targets `M0-01` and `M0-02`:

- bootstrap the Tauri + React workspace
- establish module boundaries for spike work
- define the shared DTOs used by connectivity, SQL, and safety spikes

## Intended Commands

After dependencies are installed:

```bash
npm install
npm run dev
```

For desktop shell development:

```bash
npm run tauri dev
```

For the Rust side:

```bash
cargo check --manifest-path src-tauri/Cargo.toml
```

## Notes

- The current shell is intentionally minimal and connection-first.
- Database adapters, keychain flow, and SQLite persistence are stubbed as `M0` modules and will be implemented in later spike tickets.
- Spike evidence should be stored in [`spikes/`](./spikes).

