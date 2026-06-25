import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';

import { WebhookController } from './webhook.controller';
import { WebhookProcessor } from './webhook.processor';
import { WebhookService } from './webhook.service';


@Module({
  imports: [BullModule.registerQueue({ name: 'webhooks' }), AuditModule],
  controllers: [WebhookController],
  providers: [WebhookService, WebhookProcessor],
  exports: [WebhookService],
})
export class WebhookModule {}
