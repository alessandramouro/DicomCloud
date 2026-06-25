import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';

import { StudyController } from './study.controller';
import { StudyService } from './study.service';

@Module({
  imports: [AuditModule],
  controllers: [StudyController],
  providers: [StudyService],
  exports: [StudyService],
})
export class StudyModule {}
