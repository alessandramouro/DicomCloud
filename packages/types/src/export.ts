import type { UUID, ISODateString } from './common';
import type { ExportStatus, StorageDestinationType } from './study';

export interface ExportJob {
  id: UUID;
  tenantId: UUID;
  clinicId: UUID;
  studyId: UUID;
  destinationId: UUID;
  destinationType: StorageDestinationType;
  destinationPath?: string;
  status: ExportStatus;
  priority: number;
  attempts: number;
  maxAttempts: number;
  lastError?: string;
  startedAt?: ISODateString;
  completedAt?: ISODateString;
  nextRetryAt?: ISODateString;
  fileCount: number;
  filesProcessed: number;
  totalSizeBytes: number;
  bytesTransferred: number;
  transferSpeedBps?: number;
  progressPercent: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface ExportJobLog {
  id: UUID;
  exportJobId: UUID;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  meta?: Record<string, unknown>;
  timestamp: ISODateString;
}

export interface SyncLog {
  id: UUID;
  tenantId: UUID;
  clinicId: UUID;
  edgeAgentId?: UUID;
  destinationId: UUID;
  studyId?: UUID;
  action: SyncAction;
  status: 'success' | 'failed' | 'partial';
  filesAttempted: number;
  filesSucceeded: number;
  filesFailed: number;
  bytesTransferred: number;
  duration: number;
  error?: string;
  createdAt: ISODateString;
}

export type SyncAction =
  | 'UPLOAD'
  | 'DOWNLOAD'
  | 'DELETE'
  | 'VERIFY'
  | 'RETRY'
  | 'RESUME';

export interface ExportStats {
  today: number;
  successToday: number;
  failedToday: number;
  pendingCount: number;
  runningCount: number;
  averageDurationMs: number;
  totalBytesTransferred: number;
  successRate: number;
}

// ─── Realtime (Socket.IO) payloads — shared between api, edge-agent, web ───

export interface ExportCommandPayload {
  jobId: UUID;
  tenantId: UUID;
  clinicId: UUID;
  studyId: UUID;
  destinationPath?: string;
  anonymize: boolean;
  destination: {
    type: StorageDestinationType;
    config: Record<string, unknown>;
  };
}

export interface ExportProgressEvent {
  jobId: UUID;
  tenantId: UUID;
  filesProcessed: number;
  fileCount: number;
  bytesTransferred: number;
  totalSizeBytes: number;
  progressPercent: number;
}

export interface ExportResultEvent {
  jobId: UUID;
  tenantId: UUID;
  success: boolean;
  fileCount?: number;
  bytesTransferred?: number;
  error?: string;
}
