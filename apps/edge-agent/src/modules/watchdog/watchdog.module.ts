import { Module } from '@nestjs/common';
import { WatchdogService } from './watchdog.service';
import { SyncEngineModule } from '../sync-engine/sync-engine.module';
import { CloudApiModule } from '../cloud-api/cloud-api.module';

@Module({
  imports: [SyncEngineModule, CloudApiModule],
  providers: [WatchdogService],
  exports: [WatchdogService],
})
export class WatchdogModule {}
