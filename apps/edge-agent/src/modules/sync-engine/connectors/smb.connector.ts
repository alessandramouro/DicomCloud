import * as path from 'path';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs-extra';

import type { UploadConnector } from '../sync-engine.service';

/**
 * SMB/CIFS network share connector.
 * Copies files to a mounted network share using the OS filesystem.
 * In production, the SMB share should be mounted by the OS
 * (via /etc/fstab on Linux or mapped drive on Windows).
 *
 * For environments without OS-level mounts, the smbclient
 * library can be used for direct SMB protocol access.
 */
@Injectable()
export class SmbConnector implements UploadConnector {
  private readonly logger = new Logger(SmbConnector.name);

  constructor(private readonly configService: ConfigService) {}

  async upload(filePath: string, remotePath: string, config: Record<string, unknown>): Promise<void> {
    const host = config.host as string;
    const share = config.share as string;
    const basePath = config.path as string || '';

    // Construct the full target path for OS-mounted share
    const targetPath = this.buildTargetPath(host, share, basePath, remotePath, config);

    await fs.ensureDir(path.dirname(targetPath));
    await fs.copyFile(filePath, targetPath);

    this.logger.debug(`SMB: copied ${path.basename(filePath)} → ${targetPath}`);
  }

  private buildTargetPath(
    host: string,
    share: string,
    basePath: string,
    remotePath: string,
    config: Record<string, unknown>,
  ): string {
    if (process.platform === 'win32') {
      // Windows UNC path: \\host\share\path
      const uncBase = `\\\\${host}\\${share}`;
      const fullPath = basePath ? path.join(uncBase, basePath, remotePath) : path.join(uncBase, remotePath);
      return fullPath.replace(/\//g, '\\');
    } else {
      // Linux/Mac: assume mounted at /mnt/smb/<host>/<share>
      const mountBase = config.mountPath as string || `/mnt/smb/${host}/${share}`;
      return path.join(mountBase, basePath || '', remotePath);
    }
  }

  async testConnection(config: Record<string, unknown>): Promise<boolean> {
    try {
      const host = config.host as string;
      const share = config.share as string;
      const mountPath = process.platform === 'win32'
        ? `\\\\${host}\\${share}`
        : (config.mountPath as string || `/mnt/smb/${host}/${share}`);

      await fs.access(mountPath, fs.constants.W_OK);
      return true;
    } catch {
      return false;
    }
  }
}
