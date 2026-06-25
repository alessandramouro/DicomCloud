import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as chokidar from 'chokidar';

import { DicomListenerService } from './dicom-listener.service';

/**
 * File watcher that monitors the DICOM storage directory
 * for new .dcm files — used as fallback when dcmtk is unavailable
 * or as primary method when working with shared folder.
 */
@Injectable()
export class DicomFileWatcherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DicomFileWatcherService.name);
  private watcher?: chokidar.FSWatcher;

  constructor(
    private readonly configService: ConfigService,
    private readonly listenerService: DicomListenerService,
  ) {}

  async onModuleInit() {
    const storageDir = this.configService.get<string>('dicom.storageDirectory', './storage/received');

    this.watcher = chokidar.watch(`${storageDir}/**/*.dcm`, {
      persistent: true,
      ignoreInitial: false,
      awaitWriteFinish: {
        stabilityThreshold: 1000,
        pollInterval: 200,
      },
      depth: 10,
    });

    this.watcher.on('add', (filePath) => {
      this.logger.debug(`New DICOM file detected: ${filePath}`);
      this.listenerService.onFileReceived(filePath).catch((err) => {
        this.logger.error(`Error handling file ${filePath}: ${err.message}`);
      });
    });

    this.watcher.on('error', (err) => {
      this.logger.error(`Watcher error: ${err}`);
    });

    this.logger.log(`DICOM file watcher started on: ${storageDir}`);
  }

  onModuleDestroy() {
    this.watcher?.close();
  }
}
