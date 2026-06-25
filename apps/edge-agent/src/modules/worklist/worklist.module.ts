import { Module } from '@nestjs/common';

import { CloudApiModule } from '../cloud-api/cloud-api.module';

import { WorklistScpService } from './worklist-scp.service';
import { WorklistSyncService } from './worklist-sync.service';

@Module({
  imports: [CloudApiModule],
  providers: [WorklistSyncService, WorklistScpService],
})
export class WorklistModule {}
