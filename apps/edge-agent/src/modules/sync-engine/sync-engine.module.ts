import { Module } from '@nestjs/common';

import { QueueModule } from '../queue/queue.module';

import { GoogleDriveConnector } from './connectors/google-drive.connector';
import { OneDriveConnector } from './connectors/onedrive.connector';
import { SmbConnector } from './connectors/smb.connector';
import { SyncEngineService } from './sync-engine.service';


@Module({
  imports: [QueueModule],
  providers: [SyncEngineService, GoogleDriveConnector, OneDriveConnector, SmbConnector],
  exports: [SyncEngineService, GoogleDriveConnector, OneDriveConnector, SmbConnector],
})
export class SyncEngineModule {}
