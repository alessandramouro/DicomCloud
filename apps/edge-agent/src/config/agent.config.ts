import { registerAs } from '@nestjs/config';
import { readCredentials } from '../common/credentials-store';

const stored = readCredentials();

export default registerAs('agent', () => ({
  // Self-enrolled credentials (./storage/credentials.json) take precedence over
  // manually-configured env vars, so a zero-touch-provisioned agent doesn't need a .env edit.
  agentId: stored?.agentId || process.env.EDGE_AGENT_ID || '',
  clinicId: process.env.EDGE_AGENT_CLINIC_ID || '',
  apiKey: stored?.apiKey || process.env.EDGE_AGENT_API_KEY || '',
  cloudApiUrl: process.env.CLOUD_API_URL || 'http://localhost:3001',
  httpPort: parseInt(process.env.AGENT_HTTP_PORT || '3002', 10),
  storagePath: process.env.STORAGE_PATH || './storage',
  receivedDir: process.env.DICOM_RECEIVED_DIR || './storage/received',
  processedDir: process.env.DICOM_PROCESSED_DIR || './storage/processed',
  failedDir: process.env.DICOM_FAILED_DIR || './storage/failed',
  heartbeatIntervalSeconds: parseInt(process.env.HEARTBEAT_INTERVAL || '15', 10),
  syncIntervalSeconds: parseInt(process.env.SYNC_INTERVAL || '30', 10),
  maxConcurrentUploads: parseInt(process.env.MAX_CONCURRENT_UPLOADS || '3', 10),
  chunkSizeMB: parseInt(process.env.CHUNK_SIZE_MB || '8', 10),
}));
