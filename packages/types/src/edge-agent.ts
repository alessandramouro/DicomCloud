import type { UUID, ISODateString } from './common';

export type EdgeAgentStatus = 'ONLINE' | 'OFFLINE' | 'DEGRADED' | 'MAINTENANCE';

export interface EdgeAgent {
  id: UUID;
  tenantId: UUID;
  clinicId: UUID;
  name: string;
  version: string;
  status: EdgeAgentStatus;
  lastHeartbeatAt?: ISODateString;
  lastSyncAt?: ISODateString;
  ipAddress?: string;
  hostname?: string;
  platform?: string;
  osVersion?: string;
  metrics?: EdgeAgentMetrics;
  dicomConfig: DicomConfig;
  queueStats?: QueueStats;
  apiKey?: string;
  registeredAt: ISODateString;
  updatedAt: ISODateString;
}

export interface EdgeAgentMetrics {
  cpuUsagePercent: number;
  memoryUsedMB: number;
  memoryTotalMB: number;
  diskUsedGB: number;
  diskTotalGB: number;
  networkTxBytesPerSec: number;
  networkRxBytesPerSec: number;
  timestamp: ISODateString;
}

export interface DicomConfig {
  aeTitle: string;
  port: number;
  allowedCallingAeTitles: string[];
  receiveDirectory: string;
  processedDirectory: string;
  failedDirectory: string;
}

export interface QueueStats {
  pending: number;
  processing: number;
  failed: number;
  completed: number;
  totalSize: number;
}

export interface EdgeAgentHeartbeat {
  agentId: UUID;
  status: EdgeAgentStatus;
  metrics: EdgeAgentMetrics;
  queueStats: QueueStats;
  version: string;
  timestamp: ISODateString;
}

export interface EdgeAgentRegistration {
  clinicId: UUID;
  name: string;
  hostname: string;
  platform: string;
  osVersion: string;
  version: string;
  dicomConfig: DicomConfig;
}

export interface EdgeAgentRegistrationResponse {
  agentId: UUID;
  apiKey: string;
  config: EdgeAgentRemoteConfig;
}

export interface EdgeAgentRemoteConfig {
  syncIntervalSeconds: number;
  heartbeatIntervalSeconds: number;
  maxConcurrentUploads: number;
  chunkSizeMB: number;
  retryAttempts: number;
  retryDelaySeconds: number;
  storageDestinations: RemoteStorageDestination[];
}

export interface RemoteStorageDestination {
  id: UUID;
  name: string;
  type: string;
  isDefault: boolean;
  config: Record<string, unknown>;
}
