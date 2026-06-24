import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { StorageService } from './storage.service';
import { RequirePermissions, Public } from '../../common/decorators/roles.decorator';

@ApiTags('storage')
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'storage', version: '1' })
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Get('oauth/google/url')
  @RequirePermissions('storage:configure')
  @ApiOperation({ summary: 'Get Google Drive OAuth authorization URL' })
  googleAuthUrl(
    @Query('clinicId') clinicId: string,
    @Query('destinationId') destinationId: string,
  ) {
    return { url: this.storageService.getGoogleAuthUrl(clinicId, destinationId) };
  }

  @Get('oauth/microsoft/url')
  @RequirePermissions('storage:configure')
  @ApiOperation({ summary: 'Get Microsoft OneDrive OAuth authorization URL' })
  microsoftAuthUrl(
    @Query('clinicId') clinicId: string,
    @Query('destinationId') destinationId: string,
  ) {
    return { url: this.storageService.getMicrosoftAuthUrl(clinicId, destinationId) };
  }
}
