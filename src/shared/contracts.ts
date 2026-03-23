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
  secretRef?: string;
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

interface MetadataColumn {
  name: string;
  dataType: string;
  nullable: boolean;
  defaultValue?: string;
}

interface MetadataDetail {
  target: MetadataObject;
  columns: MetadataColumn[];
  notes: string[];
}

interface QueryJob {
  jobId: string;
  state: QueryJobState;
  submittedSql?: string;
}

interface QueryResultColumn {
  name: string;
  dataType: string;
}

interface LocalStoreStatus {
  dbPath: string;
  schemaVersion: number;
  initializedEntities: string[];
  keychainService: string;
}

interface ConnectionTestRequest {
  profile: ConnectionProfile;
  password?: string;
}

interface SaveConnectionProfileRequest {
  profile: ConnectionProfile;
  password?: string;
}

interface SavedConnectionProfile {
  profile: ConnectionProfile;
  hasSecret: boolean;
  updatedAt: string;
}

interface ConnectionTestResult {
  success: boolean;
  engine: DatabaseEngine;
  latencyMs: number;
  serverVersion?: string;
  databaseName?: string;
  notes: string[];
  session: SessionContext;
}

interface MetadataFetchRequest {
  profile: ConnectionProfile;
  password?: string;
  target?: MetadataObject;
}

interface MetadataFetchResult {
  engine: DatabaseEngine;
  explorer: MetadataObject[];
  detail?: MetadataDetail;
  notes: string[];
}

interface SqlExecutionRequest {
  profile: ConnectionProfile;
  password?: string;
  sql: string;
  rowLimit?: number;
}

interface QueryExecutionResult {
  engine: DatabaseEngine;
  job: QueryJob;
  columns: QueryResultColumn[];
  rows: string[][];
  rowCount: number;
  affectedRows?: number;
  notices: string[];
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
  localStore: LocalStoreStatus;
  sampleProfile: ConnectionProfile;
  sampleSession: SessionContext;
  sampleQueryJob: QueryJob;
  sampleMetadata: MetadataSnapshot;
}

export type {
  AppBootstrapInfo,
  CapabilityMap,
  ConnectionTestRequest,
  ConnectionTestResult,
  ConnectionProfile,
  DatabaseEngine,
  HealthCheck,
  LocalStoreStatus,
  MetadataColumn,
  MetadataDetail,
  MetadataFetchRequest,
  MetadataFetchResult,
  MetadataKind,
  MetadataObject,
  MetadataSnapshot,
  QueryExecutionResult,
  QueryJob,
  QueryJobState,
  QueryResultColumn,
  SaveConnectionProfileRequest,
  SavedConnectionProfile,
  SessionContext,
  SqlExecutionRequest,
  TlsMode,
};
