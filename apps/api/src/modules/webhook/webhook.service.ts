import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { createHmac } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    @InjectQueue('webhooks') private readonly webhookQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  @OnEvent('study.received')
  async onStudyReceived(payload: { studyId: string; tenantId: string; clinicId: string }) {
    await this.dispatch('study.received', payload.tenantId, payload.clinicId, payload);
  }

  @OnEvent('export.completed')
  async onExportCompleted(payload: unknown) {
    const p = payload as Record<string, string>;
    await this.dispatch('export.completed', p.tenantId, p.clinicId, payload);
  }

  @OnEvent('agent.status_changed')
  async onAgentStatusChanged(payload: unknown) {
    const p = payload as Record<string, string>;
    if (p.newStatus === 'OFFLINE') {
      await this.dispatch('agent.offline', p.tenantId, '', payload);
    } else if (p.previousStatus === 'OFFLINE' && p.newStatus === 'ONLINE') {
      await this.dispatch('agent.online', p.tenantId, '', payload);
    }
  }

  private async dispatch(
    event: string,
    tenantId: string,
    clinicId: string,
    data: unknown,
  ) {
    const configs = await this.prisma.webhookConfig.findMany({
      where: {
        tenantId,
        isActive: true,
        events: { has: event },
      },
    });

    for (const config of configs) {
      await this.webhookQueue.add(
        'deliver',
        { url: config.url, secret: config.secret, event, data },
        {
          attempts: config.retryAttempts,
          backoff: { type: 'exponential', delay: 2000 },
        },
      );
    }
  }

  signPayload(secret: string, payload: string): string {
    return createHmac('sha256', secret).update(payload).digest('hex');
  }
}
