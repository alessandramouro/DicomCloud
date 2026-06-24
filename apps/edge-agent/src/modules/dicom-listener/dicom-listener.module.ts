import { Module } from '@nestjs/common';
import { DicomListenerService } from './dicom-listener.service';
import { DicomParserService } from './dicom-parser.service';
import { DicomFileWatcherService } from './dicom-file-watcher.service';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [QueueModule],
  providers: [DicomListenerService, DicomParserService, DicomFileWatcherService],
  exports: [DicomListenerService],
})
export class DicomListenerModule {}
