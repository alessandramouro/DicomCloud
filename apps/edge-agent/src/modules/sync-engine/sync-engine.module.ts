import { Module } from '@nestjs/common';
import { SyncEngineService } from './sync-engine.service';
import { GoogleDriveConnector } from './connectors/google-drive.connector';
import { OneDriveConnector } from './connectors/onedrive.connector';
import { SmbConnector } from './connectors/smb.connector';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [QueueModule],
  providers: [SyncEngineService, GoogleDriveConnector, OneDriveConnector, SmbConnector],
  exports: [SyncEngineService, GoogleDriveConnector, OneDriveConnector, SmbConnector],
})
export class SyncEngineModule {}
