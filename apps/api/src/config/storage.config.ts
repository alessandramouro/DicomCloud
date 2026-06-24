import { registerAs } from '@nestjs/config';

export default registerAs('storage', () => ({
  localPath: process.env.STORAGE_LOCAL_PATH || './storage',
  maxFileSizeMB: parseInt(process.env.STORAGE_MAX_FILE_SIZE_MB || '2048', 10),
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
  },
  microsoft: {
    clientId: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    tenantId: process.env.MICROSOFT_TENANT_ID || 'common',
    redirectUri: process.env.MICROSOFT_REDIRECT_URI,
  },
}));
