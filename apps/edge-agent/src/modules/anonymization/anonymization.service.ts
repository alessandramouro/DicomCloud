import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes, createHash } from 'crypto';
import { spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs-extra';
import * as path from 'path';
import { AgentStateService } from '../state/agent-state.service';

const SALT_STATE_KEY = 'anonymization_salt';

const ERASE_TAGS = [
  'PatientBirthDate',
  'OtherPatientNames',
  'PatientAddress',
  'PatientTelephoneNumbers',
  'ReferringPhysicianName',
  'InstitutionName',
  'InstitutionAddress',
  'PerformingPhysicianName',
  'OperatorsName',
];

/**
 * De-identifies a DICOM file via dcmtk's dcmodify (real tag rewriting, not a
 * hand-rolled binary parser). The pseudonym salt is generated once and kept only
 * in the local agent_state KV table — it never leaves the device, so the mapping
 * from pseudonym back to the real patient ID can't be reversed by the cloud or
 * the export destination.
 */
@Injectable()
export class AnonymizationService {
  private readonly logger = new Logger(AnonymizationService.name);
  private readonly tempDir: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly agentState: AgentStateService,
  ) {
    this.tempDir = path.join(this.configService.get<string>('agent.storagePath', './storage'), 'anonymized');
  }

  /** Returns a path to a temporary de-identified copy — caller must delete it after use. */
  async anonymize(filePath: string, localPatientId: string | null): Promise<string> {
    await fs.ensureDir(this.tempDir);
    const outPath = path.join(this.tempDir, `${uuidv4()}.dcm`);
    await fs.copy(filePath, outPath);

    const pseudonym = this.pseudonymize(localPatientId);

    const args = [
      '-nb', // no backup files
      '-ie', // ignore errors
      '-imt', // treat "tag not found" as success — most -ea tags below won't exist on every SOP class
      '-ma', 'PatientName=ANONYMOUS',
      '-ma', `PatientID=${pseudonym}`,
      ...ERASE_TAGS.flatMap((tag) => ['-ea', tag]),
      '-ep', // erase all private tags
      outPath,
    ];

    await this.runDcmodify(args);
    return outPath;
  }

  private pseudonymize(localPatientId: string | null): string {
    const salt = this.getOrCreateSalt();
    const input = localPatientId || 'unknown';
    return createHash('sha256').update(`${input}:${salt}`).digest('hex').slice(0, 16).toUpperCase();
  }

  private getOrCreateSalt(): string {
    const existing = this.agentState.get(SALT_STATE_KEY);
    if (existing) return existing;

    const salt = randomBytes(32).toString('hex');
    this.agentState.set(SALT_STATE_KEY, salt);
    return salt;
  }

  private runDcmodify(args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const cmd = process.platform === 'win32' ? 'dcmodify.exe' : 'dcmodify';
      const proc = spawn(cmd, args);
      let stderr = '';

      proc.stderr?.on('data', (data: Buffer) => { stderr += data.toString(); });
      proc.on('error', reject);
      proc.on('exit', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`dcmodify exited with code ${code}: ${stderr.trim()}`));
      });
    });
  }
}
