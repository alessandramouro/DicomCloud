import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ExportService } from './export.service';
import { ExportController } from './export.controller';
import { ExportProcessor } from './export.processor';
import { ExportEventListener } from './export-event.listener';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { RealtimeModule } from '../realtime/realtime.module';

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
