import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { DatabaseService } from '../../database/database.service';
import { CloudApiService } from '../cloud-api/cloud-api.service';

@Injectable()
export class AgentStateService {
  private readonly logger = new Logger(AgentStateService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly database: DatabaseService,
    private readonly cloudApi: CloudApiService,
  ) {}

  async initialize() {
    const agentId = this.config.get<string>('agent.agentId');

    if (!agentId) {
      this.logger.warn('Agent ID not configured. Run registration first.');
      return;
    }

    // Sync storage destinations from cloud
    await this.syncDestinations();

    this.logger.log(`Agent initialized: ${agentId}`);
  }

  private async syncDestinations() {
    try {
      const destinations = await this.cloudApi.getStorageDestinations();

      this.database.transaction(() => {
        this.database.run('DELETE FROM sync_destinations');
        for (const dest of destinations as any[]) {
          this.database.run(
            `INSERT INTO sync_destinations (id, name, type, is_default, is_active, config)
             VALUES (?, ?, ?, ?, ?, ?)`,
            dest.id,
            dest.name,
            dest.type,
            dest.isDefault ? 1 : 0,
            dest.isActive ? 1 : 0,
            JSON.stringify(dest.config || {}),
          );
        }
      });

      if (destinations.length > 0) {
        this.logger.log(`Synced ${destinations.length} storage destinations from cloud`);
      }
    } catch (err) {
      this.logger.warn(`Could not sync destinations: ${(err as Error).message}`);
    }
  }

  get(key: string): string | undefined {
    const row = this.database.get('SELECT value FROM agent_state WHERE key = ?', key) as { value: string } | undefined;
    return row?.value;
  }

  set(key: string, value: string): void {
    this.database.run(
      `INSERT OR REPLACE INTO agent_state (key, value, updated_at) VALUES (?, ?, datetime('now'))`,
      key,
      value,
    );
  }
}
