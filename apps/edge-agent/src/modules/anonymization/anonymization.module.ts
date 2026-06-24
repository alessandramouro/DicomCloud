import { Module } from '@nestjs/common';
import { AnonymizationService } from './anonymization.service';
import { AgentStateModule } from '../state/agent-state.module';

@Module({
  imports: [AgentStateModule],
  providers: [AnonymizationService],
  exports: [AnonymizationService],
})
export class AnonymizationModule {}
