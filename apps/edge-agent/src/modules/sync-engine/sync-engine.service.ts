import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import pLimit from 'p-limit';
import { QueueService, QueueItem } from '../queue/queue.service';
import { DatabaseService } from '../../database/database.service';
import { GoogleDriveConnector } from './connectors/google-drive.connector';
import { OneDriveConnector } from './connectors/onedrive.connector';
import { SmbConnector } from './connectors/smb.connector';

export interface UploadConnector {
  upload(filePath: string, remotePath: string, config: Record<string, unknown>): Promise<void>;
  testConnection(config: Record<string, unknown>): Promise<boolean>;
}

@Injectable()
export class SyncEngineService {
  private readonly logger = new Logger(SyncEngineService.name);
  private isSyncing = false;
  private readonly maxConcurrent: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly queueService: QueueService,
    private readonly database: DatabaseService,
    private readonly eventEmitter: EventEmitter2,
    private readonly googleDrive: GoogleDriveConnector,
    private readonly oneDrive: OneDriveConnector,
    private readonly smb: SmbConnector,
  ) {
    this.maxConcurrent = configService.get<number>('agent.maxConcurrentUploads', 3);
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async runSync() {
    if (this.isSyncing) return;

    this.isSyncing = true;
    const limit = pLimit(this.maxConcurrent);

    try {
      const items = this.queueService.getPendingItems(this.maxConcurrent * 3);

      if (items.length === 0) return;

      this.logger.debug(`Processing ${items.length} queue items`);

      const tasks = items.map((item) =>
        limit(() => this.processItem(item)),
      );

      await Promise.allSettled(tasks);
    } catch (err) {
      this.logger.error(`Sync error: ${(err as Error).message}`);
    } finally {
      this.isSyncing = false;
    }
  }

  private async processItem(item: QueueItem): Promise<void> {
    this.queueService.markProcessing(item.id);

    try {
      const destination = this.database.get(
        'SELECT * FROM sync_destinations WHERE id = ?',
        item.destinationId,
      ) as Record<string, unknown> | undefined;

      if (!destination) {
        this.queueService.markFailed(item.id, 'Destination not found');
        return;
      }

      const config = JSON.parse(destination.config as string || '{}') as Record<string, unknown>;
      const connector = this.getConnector(item.destinationType);

      if (!connector) {
        this.queueService.markFailed(item.id, `No connector for type: ${item.destinationType}`);
        return;
      }

      await connector.upload(item.filePath, item.remotePath, config);

      this.queueService.markCompleted(item.id);

      this.eventEmitter.emit('sync.file_uploaded', {
        queueItemId: item.id,
        studyId: item.studyId,
        destinationId: item.destinationId,
        filePath: item.filePath,
      });

      this.logger.debug(`Uploaded: ${item.filePath} → ${item.remotePath}`);
    } catch (err) {
      const error = (err as Error).message;
      this.logger.warn(`Upload failed for ${item.filePath}: ${error}`);
      this.queueService.markFailed(item.id, error);
    }
  }

  @OnEvent('sync.destinations_updated')
  async refreshDestinations() {
    this.logger.log('Storage destinations refreshed from cloud config');
  }

  getQueueStats() {
    return this.queueService.getStats();
  }

  private getConnector(type: string): UploadConnector | null {
    switch (type) {
      case 'GOOGLE_DRIVE': return this.googleDrive;
      case 'ONEDRIVE': return this.oneDrive;
      case 'SMB': return this.smb;
      default: return null;
    }
  }
}
