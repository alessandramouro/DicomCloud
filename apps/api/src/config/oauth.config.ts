import { registerAs } from '@nestjs/config';

export default registerAs('oauth', () => ({
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/v1/oauth/google/callback',
  microsoftClientId: process.env.MICROSOFT_CLIENT_ID || '',
  microsoftClientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
  microsoftTenantId: process.env.MICROSOFT_TENANT_ID || 'common',
  microsoftRedirectUri: process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:3001/api/v1/oauth/microsoft/callback',
}));
