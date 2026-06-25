import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';

import { ClinicController } from './clinic.controller';
import { ClinicService } from './clinic.service';

@Module({
  imports: [AuditModule],
  controllers: [ClinicController],
  providers: [ClinicService],
  exports: [ClinicService],
})
export class ClinicModule {}
