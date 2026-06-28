import * as path from 'path';

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { DicomMetadata } from '@smartpacs/types';
import axios, { AxiosInstance } from 'axios';
import * as fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';

import { DatabaseService } from '../../database/database.service';

import { DicomListenerService } from './dicom-listener.service';
import { OrthancSupervisorService } from './orthanc-supervisor.service';

interface OrthancChange {
  Seq: number;
  ChangeType: string;
  ResourceType: string;
  ID: string;
}

/**
 * Polls the local Orthanc instance's REST /changes feed for newly-received
 * instances/studies, replicating the same downstream pipeline (SQLite
 * studies/dicom_files/queue_items + events) that the storescp/file-watcher
 * path drives via DicomListenerService.onFileReceived -- so everything past
 * "a file landed on disk" stays identical regardless of which receiver is
 * active. On StableStudy, also enqueues the study for the central-archive
 * forwarder (orthanc_forward_queue), which storescp mode has no equivalent of.
 */
@Injectable()
export class OrthancChangePollerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OrthancChangePollerService.name);
  private readonly client: AxiosInstance;
  private readonly storageDir: string;
  private readonly pollIntervalMs: number;
  private timer?: ReturnType<typeof setInterval>;
  private polling = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly database: DatabaseService,
    private readonly orthancSupervisor: OrthancSupervisorService,
    private readonly dicomListener: DicomListenerService,
  ) {
    this.storageDir = this.configService.get<string>('dicom.storageDirectory', './storage/received');
    this.pollIntervalMs = this.configService.get<number>('dicom.orthanc.pollIntervalMs', 5000);
    this.client = axios.create({ timeout: 10000 });
  }

  onModuleInit() {
    if (!this.configService.get<boolean>('dicom.orthanc.enabled', false)) return;
    this.timer = setInterval(() => this.poll().catch((err) => this.logger.debug(err.message)), this.pollIntervalMs);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private async poll() {
    if (this.polling) return;
    this.polling = true;

    try {
      const since = this.getCursor();
      const baseUrl = this.orthancSupervisor.getHttpBaseUrl();
      const res = await this.client.get(`${baseUrl}/changes`, { params: { since, limit: 100 } });
      const changes: OrthancChange[] = res.data?.Changes ?? [];

      for (const change of changes) {
        await this.handleChange(change, baseUrl).catch((err) =>
          this.logger.warn(`Failed to process change ${change.Seq} (${change.ChangeType}): ${err.message}`),
        );
      }

      const last = res.data?.Last;
      if (typeof last === 'number') this.setCursor(last);
    } catch (err) {
      this.logger.debug(`Orthanc /changes poll failed: ${(err as Error).message}`);
    } finally {
      this.polling = false;
    }
  }

  private async handleChange(change: OrthancChange, baseUrl: string): Promise<void> {
    if (change.ChangeType === 'NewInstance' && change.ResourceType === 'Instance') {
      await this.importInstance(change.ID, baseUrl);
      return;
    }

    if (change.ChangeType === 'StableStudy' && change.ResourceType === 'Study') {
      await this.enqueueForward(change.ID, baseUrl);
    }
  }

  private async importInstance(instanceId: string, baseUrl: string): Promise<void> {
    const [tagsRes, fileRes] = await Promise.all([
      this.client.get(`${baseUrl}/instances/${instanceId}/tags`, { params: { simplify: true } }),
      this.client.get(`${baseUrl}/instances/${instanceId}/file`, { responseType: 'arraybuffer' }),
    ]);

    const tags = tagsRes.data as Record<string, string>;
    const studyUid = tags.StudyInstanceUID;
    if (!studyUid) return;

    const metadata: Partial<DicomMetadata> = {
      studyInstanceUid: studyUid,
      patientId: tags.PatientID,
      patientName: tags.PatientName?.replace(/\^/g, ' ')?.trim(),
      studyDate: tags.StudyDate,
      modality: tags.Modality as DicomMetadata['modality'],
      seriesInstanceUid: tags.SeriesInstanceUID,
      sopInstanceUid: tags.SOPInstanceUID,
      accessionNumber: tags.AccessionNumber,
      institutionName: tags.InstitutionName,
      stationName: tags.StationName,
      manufacturer: tags.Manufacturer,
    };

    const studyDir = path.join(this.storageDir, `study_${studyUid.replace(/\./g, '_')}`);
    await fs.ensureDir(studyDir);
    const targetPath = path.join(studyDir, `${tags.SOPInstanceUID || uuidv4()}.dcm`);
    await fs.writeFile(targetPath, Buffer.from(fileRes.data as ArrayBuffer));

    await this.dicomListener.registerReceivedFile(targetPath, studyDir, metadata);
  }

  private async enqueueForward(orthancStudyId: string, baseUrl: string): Promise<void> {
    const studyRes = await this.client.get(`${baseUrl}/studies/${orthancStudyId}`);
    const studyUid = studyRes.data?.MainDicomTags?.StudyInstanceUID;
    if (!studyUid) return;

    const localStudy = this.database.get(
      'SELECT id FROM studies WHERE study_instance_uid = ?',
      studyUid,
    ) as { id: string } | undefined;
    if (!localStudy) return;

    const existing = this.database.get(
      `SELECT id FROM orthanc_forward_queue WHERE study_id = ? AND status IN ('PENDING', 'FORWARDING', 'COMPLETED')`,
      localStudy.id,
    );
    if (existing) return;

    this.database.run(
      `INSERT INTO orthanc_forward_queue (id, study_id, study_instance_uid, status, max_attempts)
       VALUES (?, ?, ?, 'PENDING', 5)`,
      uuidv4(),
      localStudy.id,
      studyUid,
    );
    this.logger.log(`Queued study ${studyUid} for central Orthanc forwarding`);
  }

  private getCursor(): number {
    const row = this.database.get(
      `SELECT value FROM agent_state WHERE key = 'orthanc_changes_since'`,
    ) as { value: string } | undefined;
    return row ? parseInt(row.value, 10) : 0;
  }

  private setCursor(seq: number): void {
    this.database.run(
      `INSERT INTO agent_state (key, value, updated_at) VALUES ('orthanc_changes_since', ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`,
      seq.toString(),
    );
  }
}
