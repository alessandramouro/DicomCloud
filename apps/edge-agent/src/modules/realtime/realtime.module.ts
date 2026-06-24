import { Module } from '@nestjs/common';
import { RealtimeClientService } from './realtime-client.service';
import { ExportHandlerService } from './export-handler.service';
import { SyncEngineModule } from '../sync-engine/sync-engine.module';
import { AnonymizationModule } from '../anonymization/anonymization.module';

@Module({
  imports: [SyncEngineModule, AnonymizationModule],
  providers: [RealtimeClientService, ExportHandlerService],
})
export class RealtimeModule {}
