import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * StorageService handles OAuth flows for Google Drive and Microsoft OneDrive.
 * It generates authorization URLs, exchanges codes for tokens,
 * and persists/refreshes tokens via OAuthToken records.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(private readonly configService: ConfigService) {}

  getGoogleAuthUrl(clinicId: string, destinationId: string): string {
    const clientId = this.configService.get<string>('storage.google.clientId');
    const redirectUri = this.configService.get<string>('storage.google.redirectUri');
    const scope = 'https://www.googleapis.com/auth/drive.file';
    const state = Buffer.from(JSON.stringify({ clinicId, destinationId })).toString('base64');

    return (
      `https://accounts.google.com/o/oauth2/v2/auth` +
      `?client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri!)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(scope)}` +
      `&access_type=offline` +
      `&prompt=consent` +
      `&state=${state}`
    );
  }

  getMicrosoftAuthUrl(clinicId: string, destinationId: string): string {
    const clientId = this.configService.get<string>('storage.microsoft.clientId');
    const tenantId = this.configService.get<string>('storage.microsoft.tenantId', 'common');
    const redirectUri = this.configService.get<string>('storage.microsoft.redirectUri');
    const scope = 'Files.ReadWrite.All offline_access';
    const state = Buffer.from(JSON.stringify({ clinicId, destinationId })).toString('base64');

    return (
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize` +
      `?client_id=${clientId}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(redirectUri!)}` +
      `&response_mode=query` +
      `&scope=${encodeURIComponent(scope)}` +
      `&state=${state}`
    );
  }
}
