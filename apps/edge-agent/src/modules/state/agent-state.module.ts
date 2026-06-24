import { Module } from '@nestjs/common';
import { AgentStateService } from './agent-state.service';
import { CloudApiModule } from '../cloud-api/cloud-api.module';

@Module({
  imports: [CloudApiModule],
  providers: [AgentStateService],
  exports: [AgentStateService],
})
export class AgentStateModule {}
