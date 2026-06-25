import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';

import { WebhookService } from './webhook.service';

interface DeliverJobData {
  configId: string;
  url: string;
  secret: string;
  event: string;
  data: unknown;
  timeoutSeconds: number;
}

@Processor('webhooks')
export class WebhookProcessor {
  private readonly logger = new Logger(WebhookProcessor.name);

  constructor(private readonly webhookService: WebhookService) {}

  @Process('deliver')
  async handleDeliver(job: Job<DeliverJobData>) {
    const { configId, url, secret, event, data, timeoutSeconds } = job.data;

    const body = JSON.stringify({ event, data, timestamp: new Date().toISOString() });
    const signature = this.webhookService.signPayload(secret, body);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), (timeoutSeconds || 30) * 1000);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Event': event,
          'X-Webhook-Signature': signature,
        },
        body,
        signal: controller.signal,
      });

      await this.webhookService.recordDeliveryResult(configId, res.status, res.ok);

      if (!res.ok) {
        throw new Error(`Webhook endpoint responded with status ${res.status}`);
      }

      this.logger.log(`Webhook delivered: ${event} -> ${url} (${res.status})`);
    } catch (err) {
      await this.webhookService.recordDeliveryResult(configId, 0, false);
      this.logger.warn(`Webhook delivery failed: ${event} -> ${url} — ${(err as Error).message}`);
      throw err; // Let Bull retry per the job's configured attempts/backoff.
    } finally {
      clearTimeout(timeout);
    }
  }
}
