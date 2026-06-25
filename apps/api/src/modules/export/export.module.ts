import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { RealtimeModule } from '../realtime/realtime.module';

import { ExportEventListener } from './export-event.listener';
import { ExportController } from './export.controller';
import { ExportProcessor } from './export.processor';
import { ExportService } from './export.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'exports' }),
    PrismaModule,
    AuditModule,
    RealtimeModule,
  ],
  controllers: [ExportController],
  providers: [ExportService, ExportProcessor, ExportEventListener],
  exports: [ExportService],
})
export class ExportModule {}
