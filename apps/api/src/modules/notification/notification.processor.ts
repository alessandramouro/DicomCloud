import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';

import { NotificationService, SendEmailOptions } from './notification.service';

@Processor('notifications')
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private readonly notificationService: NotificationService) {}

  @Process('send-email')
  async handleSendEmail(job: Job<SendEmailOptions>) {
    this.logger.debug(`Processing email job ${job.id} to: ${job.data.to}`);
    try {
      await this.notificationService.directSend(job.data);
    } catch (error) {
      this.logger.error(`Email job ${job.id} failed: ${(error as Error).message}`);
      throw error;
    }
  }
}
