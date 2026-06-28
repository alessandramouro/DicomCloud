import * as path from 'path';

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs-extra';

/**
 * Supervises a local Orthanc instance that replaces storescp as the DICOM
 * C-STORE receiver, when dicom.orthanc.enabled is set. Same spawn/on-exit/
 * restart-after-5s supervision pattern as WorklistScpService, except Orthanc
 * needs a generated JSON config file on disk before spawn (not just CLI args).
 */
@Injectable()
export class OrthancSupervisorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OrthancSupervisorService.name);
  private readonly dataDir: string;
  private readonly httpPort: number;
  private process?: ReturnType<typeof import('child_process').spawn>;
  private stopped = false;

  constructor(private readonly configService: ConfigService) {
    this.dataDir = path.resolve(this.configService.get<string>('dicom.orthanc.dataDir', './storage/orthanc'));
    this.httpPort = this.configService.get<number>('dicom.orthanc.httpPort', 8043);
  }

  async onModuleInit() {
    if (!this.configService.get<boolean>('dicom.orthanc.enabled', false)) return;

    await fs.ensureDir(this.dataDir);
    const configPath = await this.writeConfig();
    await this.start(configPath);
  }

  onModuleDestroy() {
    this.stopped = true;
    this.process?.kill();
  }

  getHttpBaseUrl(): string {
    return `http://127.0.0.1:${this.httpPort}`;
  }

  private async writeConfig(): Promise<string> {
    const aeTitle = this.configService.get<string>('dicom.aeTitle', 'SMARTPACS');
    const dicomPort = this.configService.get<number>('dicom.port', 104);

    const config = {
      Name: 'SmartPACS Edge Agent',
      StorageDirectory: path.join(this.dataDir, 'db'),
      IndexDirectory: path.join(this.dataDir, 'db'),
      DicomAet: aeTitle,
      DicomPort: dicomPort,
      DicomServerEnabled: true,
      HttpServerEnabled: true,
      HttpPort: this.httpPort,
      RemoteAccessAllowed: false, // HTTP/REST API is loopback-only; the DICOM port stays open to the clinic LAN
      AuthenticationEnabled: false,
      DicomWeb: { Enable: true, Root: '/dicom-web/' },
    };

    const configPath = path.join(this.dataDir, 'orthanc.json');
    await fs.writeJson(configPath, config, { spaces: 2 });
    return configPath;
  }

  private async start(configPath: string) {
    try {
      const { spawn } = await import('child_process');
      const cmd = this.configService.get<string>('dicom.orthanc.executable', 'Orthanc');

      this.process = spawn(cmd, [configPath], { stdio: ['ignore', 'pipe', 'pipe'] });

      this.process.stderr?.on('data', (data: Buffer) => {
        const msg = data.toString().trim();
        if (msg && !msg.includes(' W0') && !msg.includes('Orthanc has started')) this.logger.warn(`orthanc: ${msg}`);
      });

      this.process.on('exit', (code) => {
        if (this.stopped) return;
        if (code !== 0 && code !== null) {
          this.logger.warn(`Orthanc exited with code ${code}, restarting in 5s...`);
          setTimeout(() => this.start(configPath), 5000);
        }
      });

      this.logger.log(`Local Orthanc starting (DICOM port from dicom.port, HTTP on ${this.httpPort})`);
    } catch (err) {
      this.logger.warn(`Orthanc executable not available: ${(err as Error).message}`);
    }
  }
}
