import { Module } from '@nestjs/common';

import { CloudApiModule } from '../cloud-api/cloud-api.module';
import { DicomListenerModule } from '../dicom-listener/dicom-listener.module';

import { OrthancForwardService } from './orthanc-forward.service';

@Module({
  imports: [CloudApiModule, DicomListenerModule],
  providers: [OrthancForwardService],
})
export class OrthancForwardModule {}
