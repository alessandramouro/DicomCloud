import { Module } from '@nestjs/common';
import { EdgeAgentController } from './edge-agent.controller';
import { EdgeAgentService } from './edge-agent.service';
import { AuditModule } from '../audit/audit.module';
import { StudyModule } from '../study/study.module';

@Module({
  imports: [AuditModule, StudyModule],
  controllers: [EdgeAgentController],
  providers: [EdgeAgentService],
  exports: [EdgeAgentService],
})
export class EdgeAgentModule {}
