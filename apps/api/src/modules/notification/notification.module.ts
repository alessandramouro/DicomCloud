import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';

import { NotificationListener } from './notification.listener';
import { NotificationProcessor } from './notification.processor';
import { NotificationService } from './notification.service';
@Module({
  imports: [
    BullModule.registerQueue({ name: 'notifications' }),
  ],
  providers: [NotificationService, NotificationProcessor, NotificationListener],
  exports: [NotificationService],
})
export class NotificationModule {}
