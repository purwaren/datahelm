import { useMutation, useQuery } from "@tanstack/react-query";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  executeSql,
  fetchMetadata,
  getBootstrapState,
  getHealthCheck,
  isTauriRuntimeAvailable,
  listConnectionProfiles,
  loadEditorDraft,
  runCancellationProbe,
  saveEditorDraft,
  saveConnectionProfile,
  testConnection,
} from "../api/tauri-client";
import type {
  CancellationProbeResult,
  ConnectionProfile,
  ConnectionTestResult,
  DatabaseEngine,
  MetadataFetchResult,
  SavedConnectionProfile,
  TlsMode,
} from "../shared/contracts";

interface ConnectionFormState {
  name: string;
  engine: DatabaseEngine;
  host: string;
  port: number;
  username: string;
  password: string;
  defaultDatabase: string;
  environmentLabel: string;
  readOnly: boolean;
  tlsMode: TlsMode;
}

const defaultConnectionForm: ConnectionFormState = {
  name: "Local PostgreSQL",
  engine: "postgresql",
  host: "127.0.0.1",
  port: 5432,
  username: "postgres",
  password: "",
  defaultDatabase: "postgres",
  environmentLabel: "local",
  readOnly: true,
  tlsMode: "prefer",
};

const sqlWorkspaceKey = "sql-editor-main";

function App() {
  const [form, setForm] = useState<ConnectionFormState>(defaultConnectionForm);
  const [sqlText, setSqlText] = useState(
    "select current_database() as database_name;",
  );
  const draftHydratedRef = useRef(false);
  const healthQuery = useQuery({
    queryKey: ["health-check"],
    queryFn: getHealthCheck,
  });

  const bootstrapQuery = useQuery({
    queryKey: ["bootstrap-state"],
    queryFn: getBootstrapState,
  });
  const savedProfilesQuery = useQuery({
    queryKey: ["saved-profiles"],
    queryFn: listConnectionProfiles,
  });
  const draftQuery = useQuery({
    queryKey: ["editor-draft", sqlWorkspaceKey],
    queryFn: () => loadEditorDraft(sqlWorkspaceKey),
  });

  const health = healthQuery.data;
  const bootstrap = bootstrapQuery.data;
  const savedProfiles = savedProfilesQuery.data ?? [];
  const connectionMutation = useMutation({
    mutationFn: async (): Promise<ConnectionTestResult> => {
      return testConnection({
        profile: toConnectionProfile(form),
        password: form.password || undefined,
      });
    },
  });
  const metadataMutation = useMutation({
    mutationFn: async (): Promise<MetadataFetchResult> =>
      fetchMetadata({
        profile: toConnectionProfile(form),
        password: form.password || undefined,
      }),
  });
  const saveProfileMutation = useMutation({
    mutationFn: async (): Promise<SavedConnectionProfile> =>
      saveConnectionProfile({
        profile: toConnectionProfile(form),
        password: form.password || undefined,
      }),
    onSuccess: () => {
      void savedProfilesQuery.refetch();
      void bootstrapQuery.refetch();
    },
  });
  const executeSqlMutation = useMutation({
    mutationFn: () =>
      executeSql({
        profile: toConnectionProfile(form),
        password: form.password || undefined,
        sql: sqlText,
        rowLimit: 100,
      }),
  });
  const cancellationProbeMutation = useMutation({
    mutationFn: (): Promise<CancellationProbeResult> =>
      runCancellationProbe({
        profile: toConnectionProfile(form),
        password: form.password || undefined,
      }),
  });
  const saveDraftMutation = useMutation({
    mutationFn: (request: {
      workspaceKey: string;
      engine?: DatabaseEngine;
      connectionProfileName?: string;
      databaseName?: string;
      sqlText: string;
    }) => saveEditorDraft(request),
  });
  const submitLabel = useMemo(
    () =>
      connectionMutation.isPending
        ? "Testing connection…"
        : `Test ${form.engine === "postgresql" ? "PostgreSQL" : "MySQL"}`,
    [connectionMutation.isPending, form.engine],
  );

  function updateForm<K extends keyof ConnectionFormState>(
    key: K,
    value: ConnectionFormState[K],
  ) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "engine") {
        const engine = value as DatabaseEngine;
        next.port = engine === "postgresql" ? 5432 : 3306;
        next.defaultDatabase = engine === "postgresql" ? "postgres" : "mysql";
        next.name = engine === "postgresql" ? "Local PostgreSQL" : "Local MySQL";
      }
      return next;
    });
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    connectionMutation.mutate();
  }

  function onSaveProfile() {
    saveProfileMutation.mutate();
  }

  function onFetchMetadata() {
    metadataMutation.mutate();
  }

  function onExecuteSql() {
    executeSqlMutation.mutate();
  }

  function onRunCancellationProbe() {
    cancellationProbeMutation.mutate();
  }

  useEffect(() => {
    if (draftHydratedRef.current) {
      return;
    }

    if (draftQuery.data) {
      setSqlText(draftQuery.data.sqlText);
    }

    if (!draftQuery.isLoading) {
      draftHydratedRef.current = true;
    }
  }, [draftQuery.data, draftQuery.isLoading]);

  useEffect(() => {
    if (!draftHydratedRef.current) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void saveDraftMutation.mutate({
        workspaceKey: sqlWorkspaceKey,
        engine: form.engine,
        connectionProfileName: form.name,
        databaseName: form.defaultDatabase || undefined,
        sqlText,
      });
    }, 600);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    form.defaultDatabase,
    form.engine,
    form.name,
    saveDraftMutation,
    sqlText,
  ]);

  return (
    <main className="page-shell">
      <section className="hero">
        <span className="eyebrow">DataHelm / M0 Bootstrap</span>
        <h1>Connection-first desktop shell for the DataHelm spike cycle.</h1>
        <p>
          This workspace implements the first two `M0` tickets: repository
          bootstrap and shared spike contracts. The shell is intentionally small,
          but the module boundaries already match the approved technical design.
        </p>
        <div className="hero-actions">
          <button type="button" disabled>
            New Connection
          </button>
          <button
            type="button"
            className="secondary"
            onClick={onExecuteSql}
            disabled={executeSqlMutation.isPending}
          >
            {executeSqlMutation.isPending ? "Running SQL…" : "Run SQL"}
          </button>
          <button
            type="button"
            className="secondary"
            onClick={onRunCancellationProbe}
            disabled={cancellationProbeMutation.isPending}
          >
            {cancellationProbeMutation.isPending
              ? "Running cancellation probe…"
              : "Run cancellation probe"}
          </button>
        </div>
      </section>

      {!isTauriRuntimeAvailable && (
        <section className="card error-banner">
          <h2>Browser Preview Mode</h2>
          <p>
            The typed bridge is ready, but Tauri commands are unavailable in a
            plain browser preview. Run `npm run tauri dev` after dependency
            installation to exercise the Rust backend commands.
          </p>
        </section>
      )}

      <section className="grid two-up">
        <article className="card">
          <p className="kicker">Workspace State</p>
          <h2>Bootstrap health</h2>
          {healthQuery.isLoading ? (
            <p>Checking bridge health…</p>
          ) : healthQuery.isError ? (
            <p className="muted">Unable to load health status from the backend.</p>
          ) : health ? (
            <>
              <div className="status">
                <span className="status-dot" />
                {health.status}
              </div>
              <p className="muted">
                Runtime: <span className="mono">{health.runtime}</span>
              </p>
              <p className="muted">
                App version:{" "}
                <span className="mono">{health.appVersion}</span>
              </p>
            </>
          ) : (
            <p className="muted">No health status available yet.</p>
          )}
        </article>

        <article className="card">
          <p className="kicker">M0 Tickets</p>
          <h2>Next recommended execution flow</h2>
          <ol className="list">
            <li>`M0-01` repository bootstrap</li>
            <li>`M0-02` shared contracts</li>
            <li>`SP1-01`, `SP1-02`, `SP3-01`</li>
            <li>`SP1-03`, `SP3-02`</li>
            <li>`SP2-01`, `SP2-02`</li>
          </ol>
        </article>
      </section>

      <section className="grid two-up" style={{ marginTop: "1rem" }}>
        <article className="card">
          <p className="kicker">Frontend / Backend Boundary</p>
          <h2>Shared contracts ready for spikes</h2>
          {bootstrapQuery.isLoading ? (
            <p>Loading bootstrap contracts…</p>
          ) : bootstrapQuery.isError || !bootstrap ? (
            <p className="muted">
              Bootstrap contracts could not be loaded from the backend.
            </p>
          ) : (
            <>
              <div className="pill-row" style={{ marginBottom: "1rem" }}>
                {bootstrap.modules.map((module) => (
                  <span className="pill" key={module}>
                    {module}
                  </span>
                ))}
              </div>
              <p className="muted">
                Sample connection:{" "}
                <span className="mono">{bootstrap.sampleProfile.name}</span> /{" "}
                {bootstrap.sampleProfile.engine}
              </p>
              <p className="muted">
                Sample session:{" "}
                <span className="mono">{bootstrap.sampleSession.sessionId}</span>
              </p>
            </>
          )}
        </article>

        <article className="card">
          <p className="kicker">Local Store</p>
          <h2>SQLite baseline ready</h2>
          {bootstrap ? (
            <>
              <p className="muted">
                Path: <span className="mono">{bootstrap.localStore.dbPath}</span>
              </p>
              <p className="muted">
                Schema version:{" "}
                <span className="mono">{bootstrap.localStore.schemaVersion}</span>
              </p>
              <p className="muted">
                Keychain service:{" "}
                <span className="mono">{bootstrap.localStore.keychainService}</span>
              </p>
              <div className="pill-row">
                {bootstrap.localStore.initializedEntities.map((entity) => (
                  <span key={entity} className="pill">
                    {entity}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p className="muted">Local store status will appear after bootstrap.</p>
          )}
        </article>
      </section>

      <section className="grid two-up" style={{ marginTop: "1rem" }}>
        <article className="card">
          <p className="kicker">SP1-01 / SP1-02</p>
          <h2>Connection test harness</h2>
          <form className="connection-form" onSubmit={onSubmit}>
            <label>
              Engine
              <select
                value={form.engine}
                onChange={(event) =>
                  updateForm("engine", event.target.value as DatabaseEngine)
                }
              >
                <option value="postgresql">PostgreSQL</option>
                <option value="mysql">MySQL</option>
              </select>
            </label>
            <label>
              Profile name
              <input
                value={form.name}
                onChange={(event) => updateForm("name", event.target.value)}
              />
            </label>
            <div className="form-row">
              <label>
                Host
                <input
                  value={form.host}
                  onChange={(event) => updateForm("host", event.target.value)}
                />
              </label>
              <label>
                Port
                <input
                  type="number"
                  value={form.port}
                  onChange={(event) =>
                    updateForm("port", Number(event.target.value))
                  }
                />
              </label>
            </div>
            <div className="form-row">
              <label>
                Username
                <input
                  value={form.username}
                  onChange={(event) => updateForm("username", event.target.value)}
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) => updateForm("password", event.target.value)}
                />
              </label>
            </div>
            <div className="form-row">
              <label>
                Default database
                <input
                  value={form.defaultDatabase}
                  onChange={(event) =>
                    updateForm("defaultDatabase", event.target.value)
                  }
                />
              </label>
              <label>
                Environment label
                <input
                  value={form.environmentLabel}
                  onChange={(event) =>
                    updateForm("environmentLabel", event.target.value)
                  }
                />
              </label>
            </div>
            <div className="form-row">
              <label>
                TLS mode
                <select
                  value={form.tlsMode}
                  onChange={(event) =>
                    updateForm("tlsMode", event.target.value as TlsMode)
                  }
                >
                  <option value="disable">disable</option>
                  <option value="prefer">prefer</option>
                  <option value="require">require</option>
                  <option value="verify-ca">verify-ca</option>
                  <option value="verify-full">verify-full</option>
                </select>
              </label>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={form.readOnly}
                  onChange={(event) =>
                    updateForm("readOnly", event.target.checked)
                  }
                />
                Read-only mode
              </label>
            </div>
            <button type="submit" disabled={connectionMutation.isPending}>
              {submitLabel}
            </button>
            <div className="hero-actions">
              <button
                type="button"
                className="secondary"
                onClick={onSaveProfile}
                disabled={saveProfileMutation.isPending}
              >
                {saveProfileMutation.isPending ? "Saving profile…" : "Save profile"}
              </button>
              <button
                type="button"
                className="secondary"
                onClick={onFetchMetadata}
                disabled={metadataMutation.isPending}
              >
                {metadataMutation.isPending
                  ? "Loading metadata…"
                  : "Fetch metadata baseline"}
              </button>
            </div>
            {saveProfileMutation.isSuccess && (
              <p className="muted">
                Saved profile <span className="mono">{saveProfileMutation.data.profile.name}</span>
                {saveProfileMutation.data.hasSecret ? " with keychain secret." : "."}
              </p>
            )}
            {saveProfileMutation.isError && (
              <p className="muted">
                {(saveProfileMutation.error as Error).message}
              </p>
            )}
          </form>
        </article>

        <article className="card">
          <p className="kicker">Normalized result</p>
          <h2>Connection outcome</h2>
          {connectionMutation.isPending ? (
            <p>Attempting connection…</p>
          ) : connectionMutation.isError ? (
            <p className="muted">
              {(connectionMutation.error as Error).message}
            </p>
          ) : connectionMutation.data ? (
            <>
              <div className="status">
                <span className="status-dot" />
                {connectionMutation.data.success
                  ? "Connection succeeded"
                  : "Connection failed"}
              </div>
              <p className="muted">
                Engine:{" "}
                <span className="mono">{connectionMutation.data.engine}</span>
              </p>
              <p className="muted">
                Server version:{" "}
                <span className="mono">
                  {connectionMutation.data.serverVersion ?? "Unavailable"}
                </span>
              </p>
              <p className="muted">
                Database:{" "}
                <span className="mono">
                  {connectionMutation.data.databaseName ?? "Unavailable"}
                </span>
              </p>
              <p className="muted">
                Latency:{" "}
                <span className="mono">
                  {connectionMutation.data.latencyMs} ms
                </span>
              </p>
              <div className="pill-row">
                {connectionMutation.data.notes.map((note) => (
                  <span className="pill" key={note}>
                    {note}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p className="muted">
              No connection attempt yet. Submit the form to exercise the baseline
              adapter path.
            </p>
          )}
        </article>
      </section>

      <section className="grid two-up" style={{ marginTop: "1rem" }}>
        <article className="card">
          <p className="kicker">SP1-03</p>
          <h2>Metadata normalization baseline</h2>
          {metadataMutation.isPending ? (
            <p>Loading explorer and detail metadata…</p>
          ) : metadataMutation.isError ? (
            <p className="muted">{(metadataMutation.error as Error).message}</p>
          ) : metadataMutation.data ? (
            <>
              <p className="muted">
                Explorer objects:{" "}
                <span className="mono">{metadataMutation.data.explorer.length}</span>
              </p>
              <div className="pill-row" style={{ marginBottom: "1rem" }}>
                {metadataMutation.data.notes.map((note) => (
                  <span className="pill" key={note}>
                    {note}
                  </span>
                ))}
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th>Kind</th>
                    <th>Name</th>
                    <th>Scope</th>
                  </tr>
                </thead>
                <tbody>
                  {metadataMutation.data.explorer.slice(0, 8).map((object) => (
                    <tr key={`${object.kind}:${object.database ?? ""}:${object.schema ?? ""}:${object.name}`}>
                      <td>{object.kind}</td>
                      <td>{object.name}</td>
                      <td>{object.schema ?? object.database ?? "global"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {metadataMutation.data.detail && (
                <>
                  <p className="muted" style={{ marginTop: "1rem" }}>
                    Detail target:{" "}
                    <span className="mono">
                      {metadataMutation.data.detail.target.name}
                    </span>
                  </p>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Column</th>
                        <th>Type</th>
                        <th>Nullable</th>
                        <th>Default</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metadataMutation.data.detail.columns.map((column) => (
                        <tr key={column.name}>
                          <td>{column.name}</td>
                          <td>{column.dataType}</td>
                          <td>{column.nullable ? "yes" : "no"}</td>
                          <td>{column.defaultValue ?? "none"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </>
          ) : (
            <p className="muted">
              No metadata request yet. Use the connection form to fetch a normalized
              explorer/detail payload.
            </p>
          )}
        </article>

        <article className="card">
          <p className="kicker">SP3-02</p>
          <h2>Saved profiles and keychain references</h2>
          {savedProfilesQuery.isLoading ? (
            <p>Loading saved profiles…</p>
          ) : savedProfilesQuery.isError ? (
            <p className="muted">
              {(savedProfilesQuery.error as Error).message}
            </p>
          ) : savedProfiles.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Engine</th>
                  <th>Secret</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {savedProfiles.map((savedProfile) => (
                  <tr key={savedProfile.profile.name}>
                    <td>{savedProfile.profile.name}</td>
                    <td>{savedProfile.profile.engine}</td>
                    <td>
                      {savedProfile.hasSecret
                        ? savedProfile.profile.secretRef ?? "Keychain"
                        : "No secret"}
                    </td>
                    <td>{savedProfile.updatedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted">
              No saved profiles yet. Saving a profile writes the config to SQLite
              and stores the password in the macOS keychain when provided.
            </p>
          )}
        </article>
      </section>

      <section className="card" style={{ marginTop: "1rem" }}>
        <p className="kicker">SP2-01 / SP2-02</p>
        <h2>SQL execution baseline</h2>
        <div className="sql-stack">
          <div className="pill-row">
            <span className="pill">workspace {sqlWorkspaceKey}</span>
            <span className="pill">result limit 100 rows</span>
            {draftQuery.data?.updatedAt && (
              <span className="pill">draft restored {draftQuery.data.updatedAt}</span>
            )}
          </div>
          <textarea
            className="sql-editor"
            value={sqlText}
            onChange={(event) => setSqlText(event.target.value)}
            spellCheck={false}
          />
          <div className="hero-actions">
            <button
              type="button"
              onClick={onExecuteSql}
              disabled={executeSqlMutation.isPending}
            >
              {executeSqlMutation.isPending ? "Running SQL…" : "Run current statement"}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={onRunCancellationProbe}
              disabled={cancellationProbeMutation.isPending}
            >
              {cancellationProbeMutation.isPending
                ? "Running cancellation probe…"
                : "Run cancellation probe"}
            </button>
          </div>
          {saveDraftMutation.data && (
            <p className="muted">Draft saved at {saveDraftMutation.data.updatedAt}</p>
          )}
          {executeSqlMutation.isError ? (
            <p className="muted">
              {(executeSqlMutation.error as Error).message}
            </p>
          ) : executeSqlMutation.data ? (
            <>
              <div className="pill-row">
                <span className="pill">
                  Job {executeSqlMutation.data.job.jobId}
                </span>
                <span className="pill">
                  State {executeSqlMutation.data.job.state}
                </span>
                <span className="pill">
                  Rows {executeSqlMutation.data.rowCount}
                </span>
                {executeSqlMutation.data.affectedRows !== undefined && (
                  <span className="pill">
                    Affected {executeSqlMutation.data.affectedRows}
                  </span>
                )}
              </div>
              <div className="pill-row" style={{ marginTop: "1rem" }}>
                {executeSqlMutation.data.notices.map((notice) => (
                  <span key={notice} className="pill">
                    {notice}
                  </span>
                ))}
              </div>
              {executeSqlMutation.data.columns.length > 0 ? (
                <table className="table" style={{ marginTop: "1rem" }}>
                  <thead>
                    <tr>
                      {executeSqlMutation.data.columns.map((column) => (
                        <th key={column.name}>
                          {column.name}
                          <div className="muted">{column.dataType}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {executeSqlMutation.data.rows.map((row, rowIndex) => (
                      <tr key={`row-${rowIndex}`}>
                        {row.map((value, columnIndex) => (
                          <td key={`value-${rowIndex}-${columnIndex}`}>{value}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="muted" style={{ marginTop: "1rem" }}>
                  Statement completed without a rowset.
                </p>
              )}
            </>
          ) : (
            <p className="muted">
              No SQL run yet. This surface will drive the query/results loop for
              the next spike phase.
            </p>
          )}
          {cancellationProbeMutation.data && (
            <>
              <div className="pill-row">
                <span className="pill">
                  strategy {cancellationProbeMutation.data.strategy}
                </span>
                <span className="pill">
                  supported {cancellationProbeMutation.data.supported ? "yes" : "no"}
                </span>
                <span className="pill">
                  cancelled {cancellationProbeMutation.data.cancelled ? "yes" : "no"}
                </span>
              </div>
              <p className="muted">
                Probe SQL:{" "}
                <span className="mono">
                  {cancellationProbeMutation.data.probeSql}
                </span>
              </p>
              {cancellationProbeMutation.data.observedError && (
                <p className="muted">
                  Observed error:{" "}
                  <span className="mono">
                    {cancellationProbeMutation.data.observedError}
                  </span>
                </p>
              )}
              <div className="pill-row">
                {cancellationProbeMutation.data.notes.map((note) => (
                  <span key={note} className="pill">
                    {note}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <section className="card" style={{ marginTop: "1rem" }}>
        <p className="kicker">Bootstrap Snapshot</p>
        <h2>App-facing DTO baseline</h2>
        {bootstrap ? (
          <table className="table">
            <thead>
              <tr>
                <th>Contract</th>
                <th>Current baseline</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>ConnectionProfile</td>
                <td>
                  {bootstrap.sampleProfile.engine} / {bootstrap.sampleProfile.host}:
                  {bootstrap.sampleProfile.port}
                </td>
              </tr>
              <tr>
                <td>SessionContext</td>
                <td>{bootstrap.sampleSession.database ?? "No database selected"}</td>
              </tr>
              <tr>
                <td>CapabilityMap</td>
                <td>{bootstrap.sampleSession.capabilityMap.notes.join(", ")}</td>
              </tr>
              <tr>
                <td>QueryJob</td>
                <td>{bootstrap.sampleQueryJob.state}</td>
              </tr>
              <tr>
                <td>MetadataSnapshot</td>
                <td>
                  {bootstrap.sampleMetadata.explorer.length} explorer object(s)
                </td>
              </tr>
            </tbody>
          </table>
        ) : (
          <p className="muted">No bootstrap snapshot loaded yet.</p>
        )}
      </section>
    </main>
  );
}

function toConnectionProfile(form: ConnectionFormState): ConnectionProfile {
  return {
    name: form.name,
    engine: form.engine,
    host: form.host,
    port: Number(form.port),
    username: form.username,
    defaultDatabase: form.defaultDatabase || undefined,
    environmentLabel: form.environmentLabel || undefined,
    readOnly: form.readOnly,
    tlsMode: form.tlsMode,
  };
}

export { App };
