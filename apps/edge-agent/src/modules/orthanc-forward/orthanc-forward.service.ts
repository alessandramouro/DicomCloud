import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';

import { DatabaseService } from '../../database/database.service';
import { CloudApiService } from '../cloud-api/cloud-api.service';
import { OrthancSupervisorService } from '../dicom-listener/orthanc-supervisor.service';

interface ForwardQueueItem {
  id: string;
  studyId: string;
  studyInstanceUid: string;
  attempts: number;
  maxAttempts: number;
}

/**
 * Forwards studies received by the local Orthanc into the central cloud
 * Orthanc, so they become viewable in OHIF. Kept as its own queue/cron
 * (mirroring SyncEngineService's every-30s pattern) rather than reusing
 * QueueService/UploadConnector: this is study-grained with a single fixed
 * destination, not file-grained with a user-configurable destination list,
 * so a bug or outage here can never block or slow down the existing
 * Drive/OneDrive/SMB export queue, and vice versa.
 */
@Injectable()
export class OrthancForwardService {
  private readonly logger = new Logger(OrthancForwardService.name);
  private forwarding = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly database: DatabaseService,
    private readonly cloudApi: CloudApiService,
    private readonly orthancSupervisor: OrthancSupervisorService,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async run() {
    if (!this.configService.get<boolean>('dicom.orthanc.enabled', false)) return;
    if (this.forwarding) return;

    this.forwarding = true;
    try {
      const items = this.getPendingItems(3);
      for (const item of items) {
        await this.processItem(item).catch((err) =>
          this.logger.warn(`Forward failed for study ${item.studyInstanceUid}: ${err.message}`),
        );
      }
    } finally {
      this.forwarding = false;
    }
  }

  private async processItem(item: ForwardQueueItem): Promise<void> {
    this.markForwarding(item.id);

    try {
      const baseUrl = this.orthancSupervisor.getHttpBaseUrl();
      const res = await axios.get(`${baseUrl}/dicom-web/studies/${item.studyInstanceUid}`, {
        headers: { Accept: 'multipart/related; type="application/dicom"' },
        responseType: 'arraybuffer',
        timeout: 60000,
        maxContentLength: 512 * 1024 * 1024,
        maxBodyLength: 512 * 1024 * 1024,
      });

      const contentType = res.headers['content-type'] as string;
      await this.cloudApi.forwardStudyToOrthanc(item.studyInstanceUid, Buffer.from(res.data), contentType);

      this.markCompleted(item.id);
      this.logger.log(`Forwarded study ${item.studyInstanceUid} to central Orthanc`);
    } catch (err) {
      this.markFailed(item.id, (err as Error).message);
      throw err;
    }
  }

  private getPendingItems(limit: number): ForwardQueueItem[] {
    const now = new Date().toISOString();
    const rows = this.database.all(
      `SELECT id, study_id as studyId, study_instance_uid as studyInstanceUid, attempts, max_attempts as maxAttempts
       FROM orthanc_forward_queue
       WHERE status = 'PENDING'
          OR (status = 'FAILED' AND attempts < max_attempts AND (next_retry_at IS NULL OR next_retry_at <= ?))
       ORDER BY created_at ASC
       LIMIT ?`,
      now,
      limit,
    ) as ForwardQueueItem[];
    return rows;
  }

  private markForwarding(id: string): void {
    this.database.run(
      `UPDATE orthanc_forward_queue SET status = 'FORWARDING', updated_at = datetime('now') WHERE id = ?`,
      id,
    );
  }

  private markCompleted(id: string): void {
    this.database.run(
      `UPDATE orthanc_forward_queue SET status = 'COMPLETED', updated_at = datetime('now') WHERE id = ?`,
      id,
    );
  }

  private markFailed(id: string, error: string): void {
    const item = this.database.get('SELECT * FROM orthanc_forward_queue WHERE id = ?', id) as
      | { attempts: number; max_attempts: number }
      | undefined;
    if (!item) return;

    const attempts = (item.attempts || 0) + 1;
    const maxAttempts = item.max_attempts || 5;
    const backoffSeconds = Math.min(60 * Math.pow(2, attempts - 1), 3600);
    const nextRetryAt = new Date(Date.now() + backoffSeconds * 1000).toISOString();

    this.database.run(
      `UPDATE orthanc_forward_queue
       SET status = 'FAILED', attempts = ?, last_error = ?, next_retry_at = ?, updated_at = datetime('now')
       WHERE id = ?`,
      attempts,
      error.substring(0, 500),
      attempts < maxAttempts ? nextRetryAt : null,
      id,
    );
  }
}
