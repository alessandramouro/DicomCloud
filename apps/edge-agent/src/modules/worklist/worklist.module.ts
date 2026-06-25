import { Module } from '@nestjs/common';
import { WorklistSyncService } from './worklist-sync.service';
import { WorklistScpService } from './worklist-scp.service';
import { CloudApiModule } from '../cloud-api/cloud-api.module';

@Module({
  imports: [CloudApiModule],
  providers: [WorklistSyncService, WorklistScpService],
})
export class WorklistModule {}
