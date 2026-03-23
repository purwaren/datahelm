type DatabaseEngine = "postgresql" | "mysql";
type TlsMode = "disable" | "prefer" | "require" | "verify-ca" | "verify-full";
type QueryJobState = "idle" | "running" | "succeeded" | "failed" | "cancelled";
type MetadataKind = "database" | "schema" | "table" | "view";

interface ConnectionProfile {
  name: string;
  engine: DatabaseEngine;
  host: string;
  port: number;
  username: string;
  defaultDatabase?: string;
  environmentLabel?: string;
  readOnly: boolean;
  tlsMode: TlsMode;
}

interface CapabilityMap {
  engine: DatabaseEngine;
  canListSchemas: boolean;
  canCancelQuery: boolean;
  canReadProcessList: boolean;
  canUseKeychain: boolean;
  notes: string[];
}

interface SessionContext {
  sessionId: string;
  profileName: string;
  engine: DatabaseEngine;
  database?: string;
  environmentLabel?: string;
  isReadOnly: boolean;
  capabilityMap: CapabilityMap;
}

interface MetadataObject {
  kind: MetadataKind;
  name: string;
  database?: string;
  schema?: string;
}

interface MetadataSnapshot {
  explorer: MetadataObject[];
  detailTarget?: MetadataObject;
}

interface QueryJob {
  jobId: string;
  state: QueryJobState;
  submittedSql?: string;
}

interface HealthCheck {
  status: string;
  runtime: string;
  appVersion: string;
}

interface AppBootstrapInfo {
  productName: string;
  shellStatus: string;
  workspaceFolders: string[];
  modules: string[];
  recommendedNextTickets: string[];
  sampleProfile: ConnectionProfile;
  sampleSession: SessionContext;
  sampleQueryJob: QueryJob;
  sampleMetadata: MetadataSnapshot;
}

export type {
  AppBootstrapInfo,
  CapabilityMap,
  ConnectionProfile,
  DatabaseEngine,
  HealthCheck,
  MetadataKind,
  MetadataObject,
  MetadataSnapshot,
  QueryJob,
  QueryJobState,
  SessionContext,
  TlsMode,
};

