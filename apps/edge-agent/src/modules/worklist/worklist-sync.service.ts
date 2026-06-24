import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { spawn } from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path';

/**
 * Periodically queries the clinic's HIS/RIS via dcmtk's findscu (a real C-FIND SCU)
 * and feeds the results to WorklistScpService's wlmscpfs process. wlmscpfs (per
 * dcmtk's own wlmsetup.txt) selects a "storage area" subdirectory named after the
 * CALLED AE title and only reads files with a .wl extension from it — findscu's
 * --extract writes plain .dcm files, so this service renames them into place.
 */
@Injectable()
export class WorklistSyncService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WorklistSyncService.name);
  private readonly worklistDir: string;
  private readonly aeDir: string;
  private readonly intervalMs: number;
  private isSyncing = false;
  private timer?: NodeJS.Timeout;

  constructor(private readonly configService: ConfigService) {
    this.worklistDir = path.resolve(this.configService.get<string>('dicom.worklist.dir', './storage/worklist'));
    this.aeDir = path.join(this.worklistDir, this.configService.get<string>('dicom.aeTitle', 'DICOMCLOUD'));
    this.intervalMs = this.configService.get<number>('dicom.worklist.cacheMinutes', 5) * 60 * 1000;
  }

  async onModuleInit() {
    await fs.ensureDir(this.aeDir);
    await fs.ensureFile(path.join(this.aeDir, 'lockfile'));
    if (!this.isEnabled()) return;

    this.syncFromHis().catch((err) => this.logger.error(`Initial worklist sync failed: ${(err as Error).message}`));
    this.timer = setInterval(() => {
      this.syncFromHis().catch((err) => this.logger.error(`Worklist sync failed: ${(err as Error).message}`));
    }, this.intervalMs);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private isEnabled(): boolean {
    return (
      this.configService.get<boolean>('dicom.worklist.enabled', false) &&
      !!this.configService.get<string>('dicom.worklist.hisUrl', '')
    );
  }

  async syncFromHis(): Promise<void> {
    if (this.isSyncing || !this.isEnabled()) return;
    this.isSyncing = true;

    const tempDir = path.join(this.worklistDir, `.sync-${Date.now()}`);

    try {
      const hisUrl = this.configService.get<string>('dicom.worklist.hisUrl', '');
      const [host, portStr] = hisUrl.split(':');
      const port = parseInt(portStr, 10);
      if (!host || !port) {
        this.logger.warn(`Invalid dicom.worklist.hisUrl "${hisUrl}" — expected "host:port"`);
        return;
      }

      await fs.ensureDir(tempDir);

      const ourAeTitle = this.configService.get<string>('dicom.aeTitle', 'DICOMCLOUD');
      const hisAeTitle = this.configService.get<string>('dicom.worklist.hisAeTitle', 'ANY-SCP');
      // Local date, not UTC — scheduled procedures are dated in the clinic's own
      // timezone, and toISOString() would query the wrong day for several hours
      // each evening in timezones behind UTC (e.g. most of Brazil, UTC-3).
      const now = new Date();
      const today = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

      await this.runFindscu([
        '--worklist',
        '--extract',
        '--output-directory', tempDir,
        '-aet', ourAeTitle,
        '-aec', hisAeTitle,
        '-k', 'PatientName=',
        '-k', 'PatientID=',
        '-k', 'AccessionNumber=',
        // StudyInstanceUID/RequestedProcedureID/RequestedProcedureDescription and the
        // two SPS keys below are DICOM PS3.4 Annex K Type 1/1C attributes. wlmscpfs's
        // default --enable-file-reject mode silently discards any worklist file missing
        // them (confirmed via its -d debug log), so omitting them here means the local
        // SCP would serve an empty worklist to every real modality despite sync "succeeding".
        '-k', 'StudyInstanceUID=',
        '-k', 'RequestedProcedureID=',
        '-k', 'RequestedProcedureDescription=',
        '-k', 'ScheduledProcedureStepSequence[0].Modality=',
        '-k', 'ScheduledProcedureStepSequence[0].ScheduledStationAETitle=',
        '-k', `ScheduledProcedureStepSequence[0].ScheduledProcedureStepStartDate=${today}`,
        '-k', 'ScheduledProcedureStepSequence[0].ScheduledProcedureStepStartTime=',
        '-k', 'ScheduledProcedureStepSequence[0].ScheduledProcedureStepID=',
        '-k', 'ScheduledProcedureStepSequence[0].ScheduledProcedureStepDescription=',
        host,
        port.toString(),
      ]);

      // Atomic-ish swap: write new files into the live AE-title dir (renamed .dcm -> .wl,
      // the only extension wlmscpfs reads), then remove stale ones — never delete-then-
      // refill in place, since wlmscpfs re-scans that dir per incoming association with
      // no locking of its own.
      const extracted = await fs.readdir(tempDir);
      const newFiles = extracted.map((f) => f.replace(/\.dcm$/i, '.wl'));

      for (let i = 0; i < extracted.length; i++) {
        await fs.move(path.join(tempDir, extracted[i]), path.join(this.aeDir, newFiles[i]), { overwrite: true });
      }

      const liveFiles = await fs.readdir(this.aeDir);
      for (const file of liveFiles) {
        if (file === 'lockfile' || !file.endsWith('.wl')) continue;
        if (!newFiles.includes(file)) {
          await fs.remove(path.join(this.aeDir, file));
        }
      }

      this.logger.log(`Worklist synced: ${newFiles.length} entries`);
    } catch (err) {
      this.logger.warn(`Worklist sync failed: ${(err as Error).message}`);
    } finally {
      await fs.remove(tempDir).catch(() => undefined);
      this.isSyncing = false;
    }
  }

  private runFindscu(args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const cmd = process.platform === 'win32' ? 'findscu.exe' : 'findscu';
      const proc = spawn(cmd, args);
      let stderr = '';

      proc.stderr?.on('data', (data: Buffer) => { stderr += data.toString(); });
      proc.on('error', reject);
      proc.on('exit', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`findscu exited with code ${code}: ${stderr.trim()}`));
      });
    });
  }
}
