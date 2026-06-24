import { Module } from '@nestjs/common';
import { WorklistSyncService } from './worklist-sync.service';
import { WorklistScpService } from './worklist-scp.service';

@Module({
  providers: [WorklistSyncService, WorklistScpService],
})
export class WorklistModule {}
