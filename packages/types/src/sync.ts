import type { UUID, ISODateString } from './common';

export interface SyncQueueItem {
  id: UUID;
  studyId: UUID;
  destinationId: UUID;
  filePath: string;
  remotePath: string;
  fileSize: number;
  hash: string;
  status: SyncItemStatus;
  attempts: number;
  maxAttempts: number;
  lastError?: string;
  chunkOffset?: number;
  chunkSize?: number;
  uploadId?: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  nextRetryAt?: ISODateString;
}

export type SyncItemStatus =
  | 'PENDING'
  | 'UPLOADING'
  | 'PAUSED'
  | 'COMPLETED'
  | 'FAILED'
  | 'SKIPPED';

export interface ChunkUploadState {
  uploadId: string;
  filePath: string;
  remotePath: string;
  totalSize: number;
  chunkSize: number;
  completedChunks: number[];
  totalChunks: number;
  startedAt: ISODateString;
  lastChunkAt?: ISODateString;
}

export interface ConnectivityStatus {
  internet: boolean;
  googleDrive?: boolean;
  oneDrive?: boolean;
  smb?: Record<string, boolean>;
  api?: boolean;
  lastCheckedAt: ISODateString;
}

export interface TransferProgress {
  jobId: UUID;
  fileName: string;
  totalBytes: number;
  transferredBytes: number;
  speedBps: number;
  estimatedSecondsRemaining?: number;
  progressPercent: number;
}
