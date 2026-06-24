import { Module } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [BullModule.registerQueue({ name: 'webhooks' })],
  providers: [WebhookService],
  exports: [WebhookService],
})
export class WebhookModule {}
