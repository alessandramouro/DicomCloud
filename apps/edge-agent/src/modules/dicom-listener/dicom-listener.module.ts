import { Module } from '@nestjs/common';

import { QueueModule } from '../queue/queue.module';

import { DicomFileWatcherService } from './dicom-file-watcher.service';
import { DicomListenerService } from './dicom-listener.service';
import { DicomParserService } from './dicom-parser.service';

@Module({
  imports: [QueueModule],
  providers: [DicomListenerService, DicomParserService, DicomFileWatcherService],
  exports: [DicomListenerService],
})
export class DicomListenerModule {}
