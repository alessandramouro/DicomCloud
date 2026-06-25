import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import * as si from 'systeminformation';

import { CloudApiService } from '../cloud-api/cloud-api.service';
import { SyncEngineService } from '../sync-engine/sync-engine.service';

/**
 * Watchdog — monitors system health and sends heartbeats to cloud API.
 * Collects: CPU, memory, disk, network metrics.
 * Detects: offline state, high resource usage, full disk.
 */
@Injectable()
export class WatchdogService {
  private readonly logger = new Logger(WatchdogService.name);
  private consecutiveFailures = 0;
  private isOnline = true;

  constructor(
    private readonly configService: ConfigService,
    private readonly cloudApi: CloudApiService,
    private readonly syncEngine: SyncEngineService,
  ) {}

  @Cron('*/15 * * * * *') // Every 15 seconds
  async sendHeartbeat() {
    try {
      const metrics = await this.collectMetrics();
      const queueStats = this.syncEngine.getQueueStats();

      await this.cloudApi.sendHeartbeat({
        status: this.determineStatus(metrics),
        metrics,
        queueStats: {
          pending: queueStats.PENDING?.count || 0,
          processing: queueStats.UPLOADING?.count || 0,
          failed: queueStats.FAILED?.count || 0,
          completed: queueStats.COMPLETED?.count || 0,
          totalSize: Object.values(queueStats).reduce((sum, s: any) => sum + (s.totalSize || 0), 0),
        },
      });

      this.consecutiveFailures = 0;

      if (!this.isOnline) {
        this.isOnline = true;
        this.logger.log('Connection to cloud API restored');
      }
    } catch (err) {
      this.consecutiveFailures++;
      if (this.consecutiveFailures === 1) {
        this.logger.warn(`Heartbeat failed: ${(err as Error).message}`);
      }
      if (this.consecutiveFailures >= 3 && this.isOnline) {
        this.isOnline = false;
        this.logger.error('Lost connection to cloud API — operating in offline mode');
      }
    }
  }

  @Cron('0 */5 * * * *') // Every 5 minutes — resource alerts
  async checkAlerts() {
    const metrics = await this.collectMetrics();

    if (metrics.cpuUsagePercent > 90) {
      this.logger.warn(`High CPU usage: ${metrics.cpuUsagePercent.toFixed(1)}%`);
    }

    const memUsedPercent = (metrics.memoryUsedMB / metrics.memoryTotalMB) * 100;
    if (memUsedPercent > 90) {
      this.logger.warn(`High memory usage: ${memUsedPercent.toFixed(1)}%`);
    }

    const diskUsedPercent = (metrics.diskUsedGB / metrics.diskTotalGB) * 100;
    if (diskUsedPercent > 95) {
      this.logger.error(`CRITICAL: Disk nearly full! ${diskUsedPercent.toFixed(1)}% used`);
    } else if (diskUsedPercent > 85) {
      this.logger.warn(`Disk usage high: ${diskUsedPercent.toFixed(1)}%`);
    }
  }

  private async collectMetrics() {
    const [cpu, mem, disk, net] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.fsSize(),
      si.networkStats(),
    ]);

    const mainDisk = disk.find((d) => d.mount === '/' || d.mount === 'C:') || disk[0];
    const mainNet = net[0] || { tx_sec: 0, rx_sec: 0 };

    return {
      timestamp: new Date().toISOString(),
      cpuUsagePercent: cpu.currentLoad,
      memoryUsedMB: Math.round((mem.total - mem.available) / 1024 / 1024),
      memoryTotalMB: Math.round(mem.total / 1024 / 1024),
      diskUsedGB: mainDisk ? Math.round(mainDisk.used / 1024 / 1024 / 1024) : 0,
      diskTotalGB: mainDisk ? Math.round(mainDisk.size / 1024 / 1024 / 1024) : 0,
      networkTxBytesPerSec: mainNet.tx_sec || 0,
      networkRxBytesPerSec: mainNet.rx_sec || 0,
    };
  }

  private determineStatus(metrics: Awaited<ReturnType<typeof this.collectMetrics>>) {
    const diskUsedPercent = (metrics.diskUsedGB / metrics.diskTotalGB) * 100;
    const memUsedPercent = (metrics.memoryUsedMB / metrics.memoryTotalMB) * 100;

    if (diskUsedPercent > 95 || memUsedPercent > 95 || metrics.cpuUsagePercent > 95) {
      return 'DEGRADED';
    }
    return 'ONLINE';
  }
}
