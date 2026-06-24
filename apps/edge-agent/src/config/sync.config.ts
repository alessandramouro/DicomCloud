import { registerAs } from '@nestjs/config';

export default registerAs('sync', () => ({
  retryAttempts: parseInt(process.env.SYNC_RETRY_ATTEMPTS || '5', 10),
  retryDelaySeconds: parseInt(process.env.SYNC_RETRY_DELAY_SECONDS || '60', 10),
  retryBackoffMultiplier: parseFloat(process.env.SYNC_RETRY_BACKOFF || '2'),
  maxRetryDelaySeconds: parseInt(process.env.SYNC_MAX_RETRY_DELAY || '3600', 10),
  chunkSizeMB: parseInt(process.env.CHUNK_SIZE_MB || '8', 10),
  verifyAfterUpload: process.env.SYNC_VERIFY_AFTER_UPLOAD !== 'false',
  deleteAfterExport: process.env.SYNC_DELETE_AFTER_EXPORT === 'true',
  retentionDays: parseInt(process.env.SYNC_RETENTION_DAYS || '30', 10),
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || '',
  },
  microsoft: {
    clientId: process.env.MICROSOFT_CLIENT_ID || '',
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
    tenantId: process.env.MICROSOFT_TENANT_ID || 'common',
  },
}));
