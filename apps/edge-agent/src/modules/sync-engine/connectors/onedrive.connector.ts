import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as fs from 'fs-extra';

import type { UploadConnector } from '../sync-engine.service';

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';

/**
 * Microsoft OneDrive / SharePoint connector using Microsoft Graph API.
 * Uses the chunked upload session API for files > 4MB.
 */
@Injectable()
export class OneDriveConnector implements UploadConnector {
  private readonly logger = new Logger(OneDriveConnector.name);
  private readonly chunkSizeBytes: number;

  constructor(private readonly configService: ConfigService) {
    // Must be multiple of 320 KB per Graph API spec
    const desiredMB = configService.get<number>('agent.chunkSizeMB', 8);
    const chunkCount = Math.ceil((desiredMB * 1024 * 1024) / 327680);
    this.chunkSizeBytes = chunkCount * 327680;
  }

  async upload(filePath: string, remotePath: string, config: Record<string, unknown>): Promise<void> {
    const token = await this.getAccessToken(config);
    const stat = await fs.stat(filePath);

    if (stat.size <= 4 * 1024 * 1024) {
      await this.smallUpload(filePath, remotePath, config, token);
    } else {
      await this.chunkedUpload(filePath, remotePath, config, token, stat.size);
    }
  }

  private async smallUpload(
    filePath: string,
    remotePath: string,
    config: Record<string, unknown>,
    token: string,
  ) {
    const driveId = config.driveId as string;
    const content = await fs.readFile(filePath);
    const url = driveId
      ? `${GRAPH_BASE}/drives/${driveId}/root:${remotePath}:/content`
      : `${GRAPH_BASE}/me/drive/root:${remotePath}:/content`;

    await axios.put(url, content, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/octet-stream' },
    });
  }

  private async chunkedUpload(
    filePath: string,
    remotePath: string,
    config: Record<string, unknown>,
    token: string,
    fileSize: number,
  ) {
    const driveId = config.driveId as string;
    const url = driveId
      ? `${GRAPH_BASE}/drives/${driveId}/root:${remotePath}:/createUploadSession`
      : `${GRAPH_BASE}/me/drive/root:${remotePath}:/createUploadSession`;

    // Create upload session
    const sessionRes = await axios.post(
      url,
      { item: { '@microsoft.graph.conflictBehavior': 'replace' } },
      { headers: { Authorization: `Bearer ${token}` } },
    );

    const uploadUrl = sessionRes.data.uploadUrl;
    const fileBuffer = await fs.readFile(filePath);

    let offset = 0;
    while (offset < fileSize) {
      const chunkEnd = Math.min(offset + this.chunkSizeBytes, fileSize) - 1;
      const chunk = fileBuffer.subarray(offset, chunkEnd + 1);

      await axios.put(uploadUrl, chunk, {
        headers: {
          'Content-Range': `bytes ${offset}-${chunkEnd}/${fileSize}`,
          'Content-Length': chunk.length,
        },
      });

      offset = chunkEnd + 1;
    }
  }

  private async getAccessToken(config: Record<string, unknown>): Promise<string> {
    const accessToken = config.accessToken as string;
    // In production, check expiry and refresh via Microsoft token endpoint
    return accessToken;
  }

  async testConnection(config: Record<string, unknown>): Promise<boolean> {
    try {
      const token = await this.getAccessToken(config);
      await axios.get(`${GRAPH_BASE}/me/drive`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return true;
    } catch {
      return false;
    }
  }
}
