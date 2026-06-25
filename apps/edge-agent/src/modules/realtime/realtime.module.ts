import { Module } from '@nestjs/common';

import { AnonymizationModule } from '../anonymization/anonymization.module';
import { SyncEngineModule } from '../sync-engine/sync-engine.module';

import { ExportHandlerService } from './export-handler.service';
import { RealtimeClientService } from './realtime-client.service';

@Module({
  imports: [SyncEngineModule, AnonymizationModule],
  providers: [RealtimeClientService, ExportHandlerService],
})
export class RealtimeModule {}
