import { invoke } from "@tauri-apps/api/core";
import type { AppBootstrapInfo, HealthCheck } from "../shared/contracts";

const isTauriRuntimeAvailable =
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

async function safeInvoke<T>(command: string): Promise<T> {
  if (!isTauriRuntimeAvailable) {
    throw new Error("Tauri runtime is not available in browser preview mode.");
  }

  try {
    return await invoke<T>(command);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown backend command error";
    throw new Error(message);
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

export { getBootstrapState, getHealthCheck, isTauriRuntimeAvailable };

