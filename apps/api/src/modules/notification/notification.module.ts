import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationListener } from './notification.listener';
import { BullModule } from '@nestjs/bull';
import { NotificationProcessor } from './notification.processor';
@Module({
  imports: [
    BullModule.registerQueue({ name: 'notifications' }),
  ],
  providers: [NotificationService, NotificationProcessor, NotificationListener],
  exports: [NotificationService],
})
export class NotificationModule {}
