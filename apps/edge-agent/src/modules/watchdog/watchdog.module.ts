import { Module } from '@nestjs/common';

import { CloudApiModule } from '../cloud-api/cloud-api.module';
import { SyncEngineModule } from '../sync-engine/sync-engine.module';

import { WatchdogService } from './watchdog.service';

@Module({
  imports: [SyncEngineModule, CloudApiModule],
  providers: [WatchdogService],
  exports: [WatchdogService],
})
export class WatchdogModule {}
