import { Module } from '@nestjs/common';

import { AgentStateModule } from '../state/agent-state.module';

import { AnonymizationService } from './anonymization.service';

@Module({
  imports: [AgentStateModule],
  providers: [AnonymizationService],
  exports: [AnonymizationService],
})
export class AnonymizationModule {}
