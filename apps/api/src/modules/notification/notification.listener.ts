import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { NotificationService } from './notification.service';

@Injectable()
export class NotificationListener {
  private readonly logger = new Logger(NotificationListener.name);

  constructor(private readonly notificationService: NotificationService) {}

  @OnEvent('auth.password_reset_requested')
  async handlePasswordReset(payload: {
    userId: string;
    email: string;
    name: string;
    token: string;
  }) {
    try {
      await this.notificationService.sendPasswordResetEmail(
        payload.email,
        payload.name,
        payload.token,
      );
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${payload.email}: ${(error as Error).message}`);
    }
  }
}
