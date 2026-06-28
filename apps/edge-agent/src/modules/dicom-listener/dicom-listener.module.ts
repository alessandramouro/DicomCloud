import { Module } from '@nestjs/common';

import { QueueModule } from '../queue/queue.module';

import { DicomFileWatcherService } from './dicom-file-watcher.service';
import { DicomListenerService } from './dicom-listener.service';
import { DicomParserService } from './dicom-parser.service';
import { OrthancChangePollerService } from './orthanc-change-poller.service';
import { OrthancSupervisorService } from './orthanc-supervisor.service';

@Module({
  imports: [QueueModule],
  providers: [
    DicomListenerService,
    DicomParserService,
    DicomFileWatcherService,
    OrthancSupervisorService,
    OrthancChangePollerService,
  ],
  exports: [DicomListenerService, OrthancSupervisorService],
})
export class DicomListenerModule {}
