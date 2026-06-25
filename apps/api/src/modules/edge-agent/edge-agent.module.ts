import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { StudyModule } from '../study/study.module';

import { EdgeAgentController } from './edge-agent.controller';
import { EdgeAgentService } from './edge-agent.service';

@Module({
  imports: [AuditModule, StudyModule],
  controllers: [EdgeAgentController],
  providers: [EdgeAgentService],
  exports: [EdgeAgentService],
})
export class EdgeAgentModule {}
