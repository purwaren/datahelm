import { invoke } from "@tauri-apps/api/core";
import type {
  AppBootstrapInfo,
  CancellationProbeRequest,
  CancellationProbeResult,
  ConnectionTestRequest,
  ConnectionTestResult,
  EditorDraftEntry,
  HealthCheck,
  MetadataFetchRequest,
  MetadataFetchResult,
  QueryExecutionResult,
  SaveEditorDraftRequest,
  SaveConnectionProfileRequest,
  SavedConnectionProfile,
  SqlExecutionRequest,
} from "../shared/contracts";

const isTauriRuntimeAvailable =
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

async function safeInvoke<T>(
  command: string,
  args?: Record<string, unknown>,
): Promise<T> {
  if (!isTauriRuntimeAvailable) {
    throw new Error("Tauri runtime is not available in browser preview mode.");
  }

  try {
    return await invoke<T>(command, args);
  } catch (error) {
    const message = extractInvokeErrorMessage(error);
    throw new Error(message);
  }
}

function extractInvokeErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown backend command error";
  }
}

async function getHealthCheck(): Promise<HealthCheck> {
  if (!isTauriRuntimeAvailable) {
    return {
      status: "frontend-preview",
      runtime: "browser",
      appVersion: "0.1.0",
    };
  }

  return safeInvoke<HealthCheck>("health_check");
}

async function getBootstrapState(): Promise<AppBootstrapInfo> {
  if (!isTauriRuntimeAvailable) {
    return {
      productName: "DataHelm",
      shellStatus: "frontend-preview",
      workspaceFolders: ["src", "src-tauri", "spikes", "docs"],
      modules: ["presentation", "api-bridge", "runtime", "adapters", "persistence"],
      recommendedNextTickets: ["SP1-01", "SP1-02", "SP3-01"],
      localStore: {
        dbPath: "/tmp/datahelm-preview.db",
        schemaVersion: 1,
        initializedEntities: [
          "connection_profiles",
          "editor_recovery",
          "action_log",
        ],
        keychainService: "com.datahelm.app.connection-secret",
      },
      sampleProfile: {
        name: "Local PostgreSQL",
        engine: "postgresql",
        host: "127.0.0.1",
        port: 5432,
        username: "postgres",
        defaultDatabase: "postgres",
        environmentLabel: "local",
        readOnly: true,
        tlsMode: "prefer",
      },
      sampleSession: {
        sessionId: "preview-session",
        profileName: "Local PostgreSQL",
        engine: "postgresql",
        database: "postgres",
        environmentLabel: "local",
        isReadOnly: true,
        capabilityMap: {
          engine: "postgresql",
          canListSchemas: true,
          canCancelQuery: true,
          canReadProcessList: true,
          canUseKeychain: true,
          notes: ["preview payload", "replace with Tauri command output"],
        },
      },
      sampleQueryJob: {
        jobId: "preview-job",
        state: "idle",
      },
      sampleMetadata: {
        explorer: [
          {
            kind: "database",
            name: "postgres",
          },
          {
            kind: "schema",
            database: "postgres",
            name: "public",
          },
        ],
        detailTarget: {
          kind: "schema",
          database: "postgres",
          name: "public",
        },
      },
    };
  }

  return safeInvoke<AppBootstrapInfo>("get_bootstrap_state");
}

async function testConnection(
  request: ConnectionTestRequest,
): Promise<ConnectionTestResult> {
  if (!isTauriRuntimeAvailable) {
    return {
      success: true,
      engine: request.profile.engine,
      latencyMs: 9,
      serverVersion:
        request.profile.engine === "postgresql"
          ? "PostgreSQL preview stub"
          : "MySQL preview stub",
      databaseName:
        request.profile.defaultDatabase ??
        (request.profile.engine === "postgresql" ? "postgres" : "mysql"),
      notes: ["Preview mode response", "Run via Tauri for real connectivity"],
      session: {
        sessionId: `preview-${request.profile.engine}`,
        profileName: request.profile.name,
        engine: request.profile.engine,
        database: request.profile.defaultDatabase,
        environmentLabel: request.profile.environmentLabel,
        isReadOnly: request.profile.readOnly,
        capabilityMap: {
          engine: request.profile.engine,
          canListSchemas: true,
          canCancelQuery: request.profile.engine === "postgresql",
          canReadProcessList: true,
          canUseKeychain: true,
          notes: ["preview-only capability map"],
        },
      },
    };
  }

  return safeInvoke<ConnectionTestResult>("test_connection", { request });
}

async function fetchMetadata(
  request: MetadataFetchRequest,
): Promise<MetadataFetchResult> {
  if (!isTauriRuntimeAvailable) {
    return {
      engine: request.profile.engine,
      explorer: [
        {
          kind: "database",
          name:
            request.profile.defaultDatabase ??
            (request.profile.engine === "postgresql" ? "postgres" : "mysql"),
        },
        {
          kind: "schema",
          database:
            request.profile.defaultDatabase ??
            (request.profile.engine === "postgresql" ? "postgres" : "mysql"),
          name: request.profile.engine === "postgresql" ? "public" : request.profile.username,
        },
        {
          kind: "table",
          database:
            request.profile.defaultDatabase ??
            (request.profile.engine === "postgresql" ? "postgres" : "mysql"),
          schema:
            request.profile.engine === "postgresql" ? "public" : request.profile.username,
          name: "sample_users",
        },
      ],
      detail: {
        target: {
          kind: "table",
          database:
            request.profile.defaultDatabase ??
            (request.profile.engine === "postgresql" ? "postgres" : "mysql"),
          schema:
            request.profile.engine === "postgresql" ? "public" : request.profile.username,
          name: "sample_users",
        },
        columns: [
          {
            name: "id",
            dataType: "integer",
            nullable: false,
          },
          {
            name: "email",
            dataType: "text",
            nullable: false,
          },
        ],
        notes: ["Preview metadata payload", "Run via Tauri for real schema data"],
      },
      notes: ["Preview-only metadata response"],
    };
  }

  return safeInvoke<MetadataFetchResult>("fetch_metadata", { request });
}

async function saveConnectionProfile(
  request: SaveConnectionProfileRequest,
): Promise<SavedConnectionProfile> {
  if (!isTauriRuntimeAvailable) {
    return {
      profile: {
        ...request.profile,
        secretRef: request.password ? "preview-secret-ref" : request.profile.secretRef,
      },
      hasSecret: Boolean(request.password || request.profile.secretRef),
      updatedAt: new Date().toISOString(),
    };
  }

  return safeInvoke<SavedConnectionProfile>("save_connection_profile", { request });
}

async function listConnectionProfiles(): Promise<SavedConnectionProfile[]> {
  if (!isTauriRuntimeAvailable) {
    return [];
  }

  return safeInvoke<SavedConnectionProfile[]>("list_connection_profiles");
}

async function executeSql(
  request: SqlExecutionRequest,
): Promise<QueryExecutionResult> {
  if (!isTauriRuntimeAvailable) {
    return {
      engine: request.profile.engine,
      job: {
        jobId: "preview-job-1",
        state: "succeeded",
        submittedSql: request.sql,
      },
      columns: [
        { name: "id", dataType: "integer" },
        { name: "email", dataType: "text" },
      ],
      rows: [
        ["1", "preview@example.com"],
        ["2", "second@example.com"],
      ],
      rowCount: 2,
      notices: ["Preview execution payload", "Run via Tauri for real SQL execution"],
    };
  }

  return safeInvoke<QueryExecutionResult>("execute_sql", { request });
}

async function saveEditorDraft(
  request: SaveEditorDraftRequest,
): Promise<EditorDraftEntry> {
  if (!isTauriRuntimeAvailable) {
    return {
      workspaceKey: request.workspaceKey,
      engine: request.engine,
      connectionProfileName: request.connectionProfileName,
      databaseName: request.databaseName,
      sqlText: request.sqlText,
      updatedAt: new Date().toISOString(),
    };
  }

  return safeInvoke<EditorDraftEntry>("save_editor_draft", { request });
}

async function loadEditorDraft(
  workspaceKey: string,
): Promise<EditorDraftEntry | null> {
  if (!isTauriRuntimeAvailable) {
    return null;
  }

  return safeInvoke<EditorDraftEntry | null>("load_editor_draft", { workspaceKey });
}

async function runCancellationProbe(
  request: CancellationProbeRequest,
): Promise<CancellationProbeResult> {
  if (!isTauriRuntimeAvailable) {
    return {
      engine: request.profile.engine,
      supported: request.profile.engine === "postgresql",
      cancelled: request.profile.engine === "postgresql",
      strategy:
        request.profile.engine === "postgresql"
          ? "pg_cancel_backend"
          : "KILL QUERY",
      probeSql:
        request.profile.engine === "postgresql"
          ? "select pg_sleep(10)"
          : "select sleep(10)",
      notes: ["Preview-only cancellation probe response"],
    };
  }

  return safeInvoke<CancellationProbeResult>("run_cancellation_probe", { request });
}

export {
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
};
