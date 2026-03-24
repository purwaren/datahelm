import { useMutation, useQuery } from "@tanstack/react-query";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  deleteConnectionProfile,
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
  MetadataDetail,
  MetadataFetchResult,
  MetadataObject,
  QueryExecutionResult,
  SavedConnectionProfile,
  SessionContext,
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
  secretRef?: string;
}

interface ConnectionAttemptInput {
  profile: ConnectionProfile;
  password?: string;
}

interface DeleteProfileInput {
  profileName: string;
  secretRef?: string;
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
  const [activeConnection, setActiveConnection] =
    useState<ConnectionAttemptInput | null>(null);
  const [activeSession, setActiveSession] = useState<SessionContext | null>(null);
  const [metadataResult, setMetadataResult] =
    useState<MetadataFetchResult | null>(null);
  const [selectedExplorerObject, setSelectedExplorerObject] =
    useState<MetadataObject | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const draftHydratedRef = useRef(false);
  const lastSavedDraftFingerprintRef = useRef<string | null>(null);

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

  const savedProfiles = savedProfilesQuery.data ?? [];
  const activeProfile = activeConnection?.profile ?? null;
  const canUseConnectedWorkspace = Boolean(activeConnection && activeSession);

  const metadataMutation = useMutation({
    mutationFn: async (request: ConnectionAttemptInput & { target?: MetadataObject }) =>
      fetchMetadata(request),
    onSuccess: (result, request) => {
      setMetadataResult(result);

      if (request.target) {
        setSelectedExplorerObject(request.target);
        return;
      }

      setSelectedExplorerObject((current) => {
        if (!current) {
          return null;
        }

        return result.explorer.find((item) => isSameMetadataObject(item, current)) ?? null;
      });
    },
  });

  const connectionMutation = useMutation({
    mutationFn: async (
      request: ConnectionAttemptInput,
    ): Promise<ConnectionTestResult> => testConnection(request),
    onSuccess: (result, request) => {
      const resolvedProfile: ConnectionProfile = {
        ...request.profile,
        defaultDatabase: result.databaseName ?? request.profile.defaultDatabase,
      };

      setActiveConnection({
        profile: resolvedProfile,
        password: request.password,
      });
      setActiveSession({
        ...result.session,
        database: result.databaseName ?? result.session.database,
      });
      setMetadataResult(null);
      setSelectedExplorerObject(null);
      setForm((current) => ({
        ...current,
        ...toFormState(resolvedProfile),
        password: current.password,
      }));

      metadataMutation.mutate({
        profile: resolvedProfile,
        password: request.password,
      });
    },
  });

  const saveProfileMutation = useMutation({
    mutationFn: async (): Promise<SavedConnectionProfile> =>
      saveConnectionProfile({
        profile: toConnectionProfile(form),
        password: form.password || undefined,
      }),
    onSuccess: (savedProfile) => {
      void savedProfilesQuery.refetch();
      void bootstrapQuery.refetch();
      setForm((current) => ({
        ...current,
        secretRef: savedProfile.profile.secretRef,
        password: "",
      }));

      setActiveConnection((current) =>
        current && current.profile.name === savedProfile.profile.name
          ? {
              profile: savedProfile.profile,
              password: current.password,
            }
          : current,
      );
    },
  });

  const deleteProfileMutation = useMutation({
    mutationFn: async (input: DeleteProfileInput) =>
      deleteConnectionProfile(input.profileName, input.secretRef),
    onSuccess: (_, variables) => {
      setPendingDelete(null);
      void savedProfilesQuery.refetch();

      if (activeConnection?.profile.name === variables.profileName) {
        disconnectWorkspace();
      }

      setForm((current) =>
        current.name === variables.profileName ? defaultConnectionForm : current,
      );
    },
  });

  const executeSqlMutation = useMutation({
    mutationFn: (request: ConnectionAttemptInput) =>
      executeSql({
        profile: request.profile,
        password: request.password,
        sql: sqlText,
        rowLimit: 100,
      }),
  });

  const cancellationProbeMutation = useMutation({
    mutationFn: (request: ConnectionAttemptInput): Promise<CancellationProbeResult> =>
      runCancellationProbe(request),
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
        ? "Connecting…"
        : `Connect to ${form.engine === "postgresql" ? "PostgreSQL" : "MySQL"}`,
    [connectionMutation.isPending, form.engine],
  );

  const groupedExplorer = useMemo(
    () => groupExplorerObjects(metadataResult?.explorer ?? []),
    [metadataResult?.explorer],
  );

  const selectedDetail = useMemo(
    () =>
      metadataResult?.detail &&
      selectedExplorerObject &&
      isSameMetadataObject(metadataResult.detail.target, selectedExplorerObject)
        ? metadataResult.detail
        : null,
    [metadataResult?.detail, selectedExplorerObject],
  );

  const sessionTone = getSessionTone(activeSession?.environmentLabel);
  const connectionError = connectionMutation.isError
    ? formatConnectionError(connectionMutation.error as Error)
    : null;
  const metadataError = metadataMutation.isError
    ? (metadataMutation.error as Error).message
    : null;
  const sqlError = executeSqlMutation.isError
    ? (executeSqlMutation.error as Error).message
    : null;

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
        next.secretRef = undefined;
      }

      return next;
    });
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    connectionMutation.mutate(buildConnectionAttempt(form));
  }

  function onSaveProfile() {
    saveProfileMutation.mutate();
  }

  function onExecuteSql() {
    if (!activeConnection) {
      return;
    }

    executeSqlMutation.mutate(activeConnection);
  }

  function onRunCancellationProbe() {
    if (!activeConnection) {
      return;
    }

    cancellationProbeMutation.mutate(activeConnection);
  }

  function onRefreshMetadata() {
    if (!activeConnection) {
      return;
    }

    metadataMutation.mutate({
      ...activeConnection,
      target: getFetchableTarget(selectedExplorerObject),
    });
  }

  function onSelectExplorerObject(target: MetadataObject) {
    setSelectedExplorerObject(target);

    if (!activeConnection) {
      return;
    }

    const fetchableTarget = getFetchableTarget(target);
    if (!fetchableTarget) {
      return;
    }

    metadataMutation.mutate({
      ...activeConnection,
      target: fetchableTarget,
    });
  }

  function onOpenSavedProfile(savedProfile: SavedConnectionProfile) {
    const nextForm = toFormState(savedProfile.profile);
    setForm(nextForm);
    connectionMutation.mutate({
      profile: savedProfile.profile,
    });
  }

  function onEditSavedProfile(savedProfile: SavedConnectionProfile) {
    setForm(toFormState(savedProfile.profile));
  }

  function onConfirmDelete(savedProfile: SavedConnectionProfile) {
    deleteProfileMutation.mutate({
      profileName: savedProfile.profile.name,
      secretRef: savedProfile.profile.secretRef,
    });
  }

  function disconnectWorkspace() {
    setActiveConnection(null);
    setActiveSession(null);
    setMetadataResult(null);
    setSelectedExplorerObject(null);
  }

  useEffect(() => {
    if (draftHydratedRef.current) {
      return;
    }

    if (draftQuery.data) {
      setSqlText(draftQuery.data.sqlText);
      lastSavedDraftFingerprintRef.current = createDraftFingerprint({
        workspaceKey: sqlWorkspaceKey,
        engine: draftQuery.data.engine,
        connectionProfileName: draftQuery.data.connectionProfileName,
        databaseName: draftQuery.data.databaseName,
        sqlText: draftQuery.data.sqlText,
      });
    }

    if (!draftQuery.isLoading) {
      draftHydratedRef.current = true;
    }
  }, [draftQuery.data, draftQuery.isLoading]);

  useEffect(() => {
    if (!draftHydratedRef.current) {
      return;
    }

    const draftPayload = {
      workspaceKey: sqlWorkspaceKey,
      engine: activeProfile?.engine ?? form.engine,
      connectionProfileName: activeProfile?.name ?? form.name,
      databaseName: activeSession?.database ?? (form.defaultDatabase || undefined),
      sqlText,
    };
    const nextFingerprint = createDraftFingerprint(draftPayload);

    if (lastSavedDraftFingerprintRef.current === nextFingerprint) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      saveDraftMutation.mutate(draftPayload, {
        onSuccess: () => {
          lastSavedDraftFingerprintRef.current = nextFingerprint;
        },
      });
    }, 600);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    activeProfile?.engine,
    activeProfile?.name,
    activeSession?.database,
    form.defaultDatabase,
    form.engine,
    form.name,
    sqlText,
  ]);

  return (
    <main className="page-shell">
      <section className="hero">
        <span className="eyebrow">DataHelm / M1 Workspace</span>
        <h1>Connection-aware desktop shell for PostgreSQL and MySQL work.</h1>
        <p>
          This milestone moves the spike shell into a usable workspace: saved
          connections, a persistent session bar, and explorer navigation that
          reflects the connected engine.
        </p>
        <div className="hero-actions">
          <button type="button" onClick={onRefreshMetadata} disabled={!canUseConnectedWorkspace}>
            {metadataMutation.isPending ? "Refreshing explorer…" : "Refresh explorer"}
          </button>
          <button
            type="button"
            className="secondary"
            onClick={disconnectWorkspace}
            disabled={!activeSession}
          >
            Disconnect workspace
          </button>
        </div>
      </section>

      <section className={`session-bar ${sessionTone}`}>
        <div className="session-summary">
          <span className={`status-chip ${activeSession ? "connected" : "disconnected"}`}>
            {activeSession ? "Connected" : "Disconnected"}
          </span>
          <div>
            <strong>
              {activeSession?.profileName ?? "No active connection"}
            </strong>
            <p className="muted">
              {activeSession
                ? "Use the saved profile list or connection form to reconnect or switch targets."
                : "Pick a saved profile or submit the connection form to open a workspace."}
            </p>
          </div>
        </div>
        <div className="session-badges">
          <span className="session-badge">
            Engine <span className="mono">{activeSession?.engine ?? "none"}</span>
          </span>
          <span className="session-badge">
            Database <span className="mono">{activeSession?.database ?? "not connected"}</span>
          </span>
          <span className="session-badge">
            Environment{" "}
            <span className="mono">{activeSession?.environmentLabel ?? "unspecified"}</span>
          </span>
          <span
            className={`session-badge ${activeSession?.isReadOnly ? "badge-safe" : "badge-warn"}`}
          >
            {activeSession?.isReadOnly ? "Read-only session" : "Writable session"}
          </span>
        </div>
      </section>

      {!isTauriRuntimeAvailable && (
        <section className="card error-banner">
          <h2>Browser Preview Mode</h2>
          <p>
            The frontend is running, but backend commands are only available in
            Tauri. Use `npm run tauri dev` to exercise real database connections.
          </p>
        </section>
      )}

      <section className="grid workspace-grid">
        <article className="card">
          <div className="section-heading">
            <div>
              <p className="kicker">M1-01 / M1-02</p>
              <h2>Connection workspace</h2>
            </div>
            {healthQuery.data && (
              <span className="status-chip connected">
                {healthQuery.data.runtime} / {healthQuery.data.status}
              </span>
            )}
          </div>

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
                  placeholder={form.secretRef ? "Stored in keychain" : ""}
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

            <div className="hero-actions">
              <button type="submit" disabled={connectionMutation.isPending}>
                {submitLabel}
              </button>
              <button
                type="button"
                className="secondary"
                onClick={onSaveProfile}
                disabled={saveProfileMutation.isPending}
              >
                {saveProfileMutation.isPending ? "Saving…" : "Save profile"}
              </button>
            </div>
          </form>

          <div className="stack-sm">
            {form.secretRef && (
              <p className="muted">
                Stored secret: <span className="mono">{form.secretRef}</span>
              </p>
            )}
            {connectionError && (
              <p className="inline-banner inline-banner-error">{connectionError}</p>
            )}
            {saveProfileMutation.isError && (
              <p className="inline-banner inline-banner-error">
                {(saveProfileMutation.error as Error).message}
              </p>
            )}
            {saveProfileMutation.isSuccess && (
              <p className="inline-banner inline-banner-success">
                Saved profile <span className="mono">{saveProfileMutation.data.profile.name}</span>
                {saveProfileMutation.data.hasSecret ? " with keychain-backed credentials." : "."}
              </p>
            )}
          </div>
        </article>

        <article className="card">
          <div className="section-heading">
            <div>
              <p className="kicker">M1-02</p>
              <h2>Saved connections</h2>
            </div>
            <span className="session-badge">
              {savedProfiles.length} stored profile{savedProfiles.length === 1 ? "" : "s"}
            </span>
          </div>

          {savedProfilesQuery.isLoading ? (
            <p>Loading saved profiles…</p>
          ) : savedProfilesQuery.isError ? (
            <p className="inline-banner inline-banner-error">
              {(savedProfilesQuery.error as Error).message}
            </p>
          ) : savedProfiles.length === 0 ? (
            <p className="muted">
              No saved profiles yet. Save the current connection form to create a
              repeatable connection workflow.
            </p>
          ) : (
            <div className="profile-list">
              {savedProfiles.map((savedProfile) => {
                const isPendingDelete = pendingDelete === savedProfile.profile.name;
                return (
                  <article key={savedProfile.profile.name} className="profile-card">
                    <div className="profile-card-header">
                      <div>
                        <h3>{savedProfile.profile.name}</h3>
                        <p className="muted">
                          {savedProfile.profile.engine} /{" "}
                          {savedProfile.profile.defaultDatabase ?? "no database"}
                        </p>
                      </div>
                      <span
                        className={`session-badge ${
                          savedProfile.profile.readOnly ? "badge-safe" : "badge-warn"
                        }`}
                      >
                        {savedProfile.profile.readOnly ? "read-only" : "writable"}
                      </span>
                    </div>
                    <p className="muted">
                      {savedProfile.profile.host}:{savedProfile.profile.port} as{" "}
                      <span className="mono">{savedProfile.profile.username}</span>
                    </p>
                    <div className="pill-row">
                      <span className="pill">
                        env {savedProfile.profile.environmentLabel ?? "unspecified"}
                      </span>
                      <span className="pill">
                        secret {savedProfile.hasSecret ? "stored" : "not stored"}
                      </span>
                      <span className="pill">updated {savedProfile.updatedAt}</span>
                    </div>
                    <div className="hero-actions">
                      <button type="button" onClick={() => onOpenSavedProfile(savedProfile)}>
                        Open
                      </button>
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => onEditSavedProfile(savedProfile)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="secondary danger-button"
                        onClick={() =>
                          setPendingDelete((current) =>
                            current === savedProfile.profile.name
                              ? null
                              : savedProfile.profile.name,
                          )
                        }
                      >
                        Delete
                      </button>
                    </div>
                    {isPendingDelete && (
                      <div className="confirm-strip">
                        <span>Delete this saved profile?</span>
                        <button
                          type="button"
                          className="secondary danger-button"
                          onClick={() => onConfirmDelete(savedProfile)}
                          disabled={deleteProfileMutation.isPending}
                        >
                          {deleteProfileMutation.isPending ? "Deleting…" : "Confirm delete"}
                        </button>
                        <button
                          type="button"
                          className="secondary"
                          onClick={() => setPendingDelete(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
          {deleteProfileMutation.isError && (
            <p className="inline-banner inline-banner-error">
              {(deleteProfileMutation.error as Error).message}
            </p>
          )}
        </article>
      </section>

      <section className="grid workspace-grid" style={{ marginTop: "1rem" }}>
        <article className="card">
          <div className="section-heading">
            <div>
              <p className="kicker">M1-03</p>
              <h2>Explorer navigation</h2>
            </div>
            <span className="session-badge">
              {activeSession?.engine ?? "disconnected"}
            </span>
          </div>

          {!activeSession ? (
            <p className="muted">
              Connect to a database to load the explorer hierarchy.
            </p>
          ) : metadataMutation.isPending && !metadataResult ? (
            <p>Loading explorer metadata…</p>
          ) : metadataError ? (
            <p className="inline-banner inline-banner-error">{metadataError}</p>
          ) : !metadataResult || metadataResult.explorer.length === 0 ? (
            <p className="muted">
              No explorer objects were returned for this connection. This can
              happen with empty databases or limited permissions.
            </p>
          ) : (
            <>
              <p className="muted">
                Engine-specific hierarchy is normalized, but still reflects real
                platform differences: PostgreSQL shows schemas, while MySQL
                navigates database objects directly.
              </p>
              <div className="explorer-groups">
                {groupedExplorer.map((group) => (
                  <section key={group.label} className="explorer-group">
                    <h3>{group.label}</h3>
                    <div className="explorer-list">
                      {group.items.map((object) => {
                        const selected =
                          selectedExplorerObject &&
                          isSameMetadataObject(selectedExplorerObject, object);

                        return (
                          <button
                            key={metadataObjectKey(object)}
                            type="button"
                            className={`explorer-item ${selected ? "selected" : ""}`}
                            onClick={() => onSelectExplorerObject(object)}
                          >
                            <span>{object.name}</span>
                            <span className="muted">
                              {describeObjectScope(object)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </>
          )}
        </article>

        <article className="card">
          <div className="section-heading">
            <div>
              <p className="kicker">Selection</p>
              <h2>Selected object</h2>
            </div>
            {selectedExplorerObject && (
              <span className="session-badge">{selectedExplorerObject.kind}</span>
            )}
          </div>

          {!selectedExplorerObject ? (
            <p className="muted">
              Select a database, schema, table, or view from the explorer to
              frame the current workspace.
            </p>
          ) : (
            <>
              <div className="pill-row">
                <span className="pill">{selectedExplorerObject.kind}</span>
                <span className="pill">{describeObjectScope(selectedExplorerObject)}</span>
              </div>
              <p className="selection-title">
                <span className="mono">{selectedExplorerObject.name}</span>
              </p>
              {selectedDetail ? (
                <MetadataDetailTable detail={selectedDetail} />
              ) : (
                <p className="muted">
                  Detail is only loaded for tables and views in this milestone.
                </p>
              )}
              {metadataResult?.notes.length ? (
                <div className="pill-row">
                  {metadataResult.notes.map((note) => (
                    <span key={note} className="pill">
                      {note}
                    </span>
                  ))}
                </div>
              ) : null}
            </>
          )}
        </article>
      </section>

      <section className="card" style={{ marginTop: "1rem" }}>
        <div className="section-heading">
          <div>
            <p className="kicker">SQL Workspace</p>
            <h2>M0 baseline carried into M1</h2>
          </div>
          {bootstrapQuery.data && (
            <span className="session-badge">
              schema v{bootstrapQuery.data.localStore.schemaVersion}
            </span>
          )}
        </div>
        <div className="sql-stack">
          <div className="pill-row">
            <span className="pill">workspace {sqlWorkspaceKey}</span>
            <span className="pill">result limit 100 rows</span>
            <span className="pill">
              {activeSession ? `session ${activeSession.sessionId}` : "no active session"}
            </span>
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
              disabled={executeSqlMutation.isPending || !activeConnection}
            >
              {executeSqlMutation.isPending ? "Running SQL…" : "Run current statement"}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={onRunCancellationProbe}
              disabled={cancellationProbeMutation.isPending || !activeConnection}
            >
              {cancellationProbeMutation.isPending
                ? "Running cancellation probe…"
                : "Run cancellation probe"}
            </button>
          </div>
          {!activeConnection && (
            <p className="muted">
              Connect to a saved or ad hoc profile before running SQL.
            </p>
          )}
          {saveDraftMutation.data && (
            <p className="muted">Draft saved at {saveDraftMutation.data.updatedAt}</p>
          )}
          {sqlError ? (
            <p className="inline-banner inline-banner-error">{sqlError}</p>
          ) : executeSqlMutation.data ? (
            <QueryResultPanel result={executeSqlMutation.data} />
          ) : (
            <p className="muted">
              No SQL run yet. This surface remains available for smoke testing
              while `M1` focuses on workspace navigation.
            </p>
          )}
          {cancellationProbeMutation.data && (
            <CancellationProbePanel result={cancellationProbeMutation.data} />
          )}
        </div>
      </section>
    </main>
  );
}

function MetadataDetailTable({ detail }: { detail: MetadataDetail }) {
  return (
    <table className="table" style={{ marginTop: "1rem" }}>
      <thead>
        <tr>
          <th>Column</th>
          <th>Type</th>
          <th>Nullable</th>
          <th>Default</th>
        </tr>
      </thead>
      <tbody>
        {detail.columns.map((column) => (
          <tr key={column.name}>
            <td>{column.name}</td>
            <td>{column.dataType}</td>
            <td>{column.nullable ? "yes" : "no"}</td>
            <td>{column.defaultValue ?? "none"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function QueryResultPanel({ result }: { result: QueryExecutionResult }) {
  return (
    <>
      <div className="pill-row">
        <span className="pill">Job {result.job.jobId}</span>
        <span className="pill">State {result.job.state}</span>
        <span className="pill">Rows {result.rowCount}</span>
        {result.affectedRows !== undefined && (
          <span className="pill">Affected {result.affectedRows}</span>
        )}
      </div>
      <div className="pill-row" style={{ marginTop: "1rem" }}>
        {result.notices.map((notice) => (
          <span key={notice} className="pill">
            {notice}
          </span>
        ))}
      </div>
      {result.columns.length > 0 ? (
        <table className="table" style={{ marginTop: "1rem" }}>
          <thead>
            <tr>
              {result.columns.map((column) => (
                <th key={column.name}>
                  {column.name}
                  <div className="muted">{column.dataType}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.rows.map((row, rowIndex) => (
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
  );
}

function CancellationProbePanel({ result }: { result: CancellationProbeResult }) {
  return (
    <>
      <div className="pill-row">
        <span className="pill">strategy {result.strategy}</span>
        <span className="pill">supported {result.supported ? "yes" : "no"}</span>
        <span className="pill">cancelled {result.cancelled ? "yes" : "no"}</span>
      </div>
      <p className="muted">
        Probe SQL: <span className="mono">{result.probeSql}</span>
      </p>
      {result.observedError && (
        <p className="muted">
          Observed error: <span className="mono">{result.observedError}</span>
        </p>
      )}
      <div className="pill-row">
        {result.notes.map((note) => (
          <span key={note} className="pill">
            {note}
          </span>
        ))}
      </div>
    </>
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
    secretRef: form.secretRef,
  };
}

function buildConnectionAttempt(form: ConnectionFormState): ConnectionAttemptInput {
  return {
    profile: toConnectionProfile(form),
    password: form.password || undefined,
  };
}

function toFormState(profile: ConnectionProfile): ConnectionFormState {
  return {
    name: profile.name,
    engine: profile.engine,
    host: profile.host,
    port: profile.port,
    username: profile.username,
    password: "",
    defaultDatabase: profile.defaultDatabase ?? defaultDatabaseForEngine(profile.engine),
    environmentLabel: profile.environmentLabel ?? "",
    readOnly: profile.readOnly,
    tlsMode: profile.tlsMode,
    secretRef: profile.secretRef,
  };
}

function defaultDatabaseForEngine(engine: DatabaseEngine): string {
  return engine === "postgresql" ? "postgres" : "mysql";
}

function groupExplorerObjects(explorer: MetadataObject[]) {
  return [
    {
      label: "Databases",
      items: explorer.filter((item) => item.kind === "database"),
    },
    {
      label: "Schemas",
      items: explorer.filter((item) => item.kind === "schema"),
    },
    {
      label: "Tables & Views",
      items: explorer.filter(
        (item) => item.kind === "table" || item.kind === "view",
      ),
    },
  ].filter((group) => group.items.length > 0);
}

function getFetchableTarget(target: MetadataObject | null | undefined) {
  if (!target) {
    return undefined;
  }

  if (target.kind === "table" || target.kind === "view") {
    return target;
  }

  return undefined;
}

function metadataObjectKey(object: MetadataObject): string {
  return `${object.kind}:${object.database ?? ""}:${object.schema ?? ""}:${object.name}`;
}

function isSameMetadataObject(left: MetadataObject, right: MetadataObject): boolean {
  return metadataObjectKey(left) === metadataObjectKey(right);
}

function describeObjectScope(object: MetadataObject): string {
  if (object.schema && object.database) {
    return `${object.database}.${object.schema}`;
  }

  if (object.schema) {
    return object.schema;
  }

  if (object.database) {
    return object.database;
  }

  return "global";
}

function getSessionTone(environmentLabel?: string): string {
  const normalized = environmentLabel?.toLowerCase() ?? "";

  if (
    normalized.includes("prod") ||
    normalized.includes("live") ||
    normalized.includes("primary")
  ) {
    return "session-prod";
  }

  if (normalized.includes("stage") || normalized.includes("uat")) {
    return "session-stage";
  }

  return "session-neutral";
}

function formatConnectionError(error: Error): string {
  const message = error.message;
  const normalized = message.toLowerCase();

  if (
    normalized.includes("password") ||
    normalized.includes("authentication") ||
    normalized.includes("access denied")
  ) {
    return `Authentication error: ${message}`;
  }

  if (
    normalized.includes("refused") ||
    normalized.includes("timed out") ||
    normalized.includes("network") ||
    normalized.includes("dns")
  ) {
    return `Network error: ${message}`;
  }

  if (
    normalized.includes("database") ||
    normalized.includes("unknown database") ||
    normalized.includes("does not exist") ||
    normalized.includes("tls")
  ) {
    return `Configuration error: ${message}`;
  }

  return message;
}

function createDraftFingerprint(input: {
  workspaceKey: string;
  engine?: DatabaseEngine;
  connectionProfileName?: string;
  databaseName?: string;
  sqlText: string;
}): string {
  return JSON.stringify([
    input.workspaceKey,
    input.engine ?? "",
    input.connectionProfileName ?? "",
    input.databaseName ?? "",
    input.sqlText,
  ]);
}

export { App };
