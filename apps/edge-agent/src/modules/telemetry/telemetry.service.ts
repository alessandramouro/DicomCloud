import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CloudApiService } from '../cloud-api/cloud-api.service';

@Injectable()
export class TelemetryService {
  constructor(private readonly cloudApi: CloudApiService) {}

  @OnEvent('study.new')
  async onStudyNew(payload: { studyId: string; metadata: Record<string, unknown>; studyDir: string }) {
    await this.cloudApi.reportStudy({
      studyInstanceUid: payload.metadata.studyInstanceUid,
      patientId: payload.metadata.patientId,
      patientName: payload.metadata.patientName,
      studyDate: payload.metadata.studyDate,
      modalities: payload.metadata.modality ? [payload.metadata.modality] : [],
      storagePath: payload.studyDir,
      fileCount: 1,
    }).catch(() => null);
  }
}
