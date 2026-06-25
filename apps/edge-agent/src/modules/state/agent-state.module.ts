import { Module } from '@nestjs/common';

import { CloudApiModule } from '../cloud-api/cloud-api.module';

import { AgentStateService } from './agent-state.service';

@Module({
  imports: [CloudApiModule],
  providers: [AgentStateService],
  exports: [AgentStateService],
})
export class AgentStateModule {}
