import { DatabaseSync } from 'node:sqlite';
import * as path from 'path';

import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs-extra';

export interface RunResult {
  changes: number;
  lastInsertRowid: number | bigint;
}

/**
 * SQLite database for edge agent local persistence using Node.js built-in node:sqlite.
 * Stores queue items, study metadata, sync state, and agent config.
 * Survives network outages and process restarts.
 */
@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private db!: DatabaseSync;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const storagePath = this.configService.get<string>('agent.storagePath', './storage');
    await fs.ensureDir(storagePath);

    const dbPath = path.join(storagePath, 'agent.db');
    this.db = new DatabaseSync(dbPath);

    this.db.exec('PRAGMA journal_mode = WAL');
    this.db.exec('PRAGMA synchronous = NORMAL');
    this.db.exec('PRAGMA foreign_keys = ON');
    this.db.exec('PRAGMA busy_timeout = 5000');

    this.runMigrations();
    this.logger.log(`SQLite database initialized at: ${dbPath}`);
  }

  onModuleDestroy() {
    this.db?.close();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get(sql: string, ...params: unknown[]): unknown {
    return this.db.prepare(sql).get(...(params as any[]));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  all(sql: string, ...params: unknown[]): unknown[] {
    return this.db.prepare(sql).all(...(params as any[])) as unknown[];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  run(sql: string, ...params: unknown[]): RunResult {
    return this.db.prepare(sql).run(...(params as any[])) as RunResult;
  }

  transaction<T>(fn: () => T): T {
    this.db.exec('BEGIN');
    try {
      const result = fn();
      this.db.exec('COMMIT');
      return result;
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  private runMigrations() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS queue_items (
        id TEXT PRIMARY KEY,
        study_id TEXT NOT NULL,
        destination_id TEXT NOT NULL,
        destination_type TEXT NOT NULL,
        file_path TEXT NOT NULL,
        remote_path TEXT NOT NULL,
        file_size INTEGER NOT NULL DEFAULT 0,
        file_hash TEXT,
        status TEXT NOT NULL DEFAULT 'PENDING',
        attempts INTEGER NOT NULL DEFAULT 0,
        max_attempts INTEGER NOT NULL DEFAULT 5,
        last_error TEXT,
        chunk_offset INTEGER DEFAULT 0,
        upload_id TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        next_retry_at TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_queue_status ON queue_items(status);
      CREATE INDEX IF NOT EXISTS idx_queue_study ON queue_items(study_id);
      CREATE INDEX IF NOT EXISTS idx_queue_retry ON queue_items(next_retry_at) WHERE status = 'FAILED';

      CREATE TABLE IF NOT EXISTS studies (
        id TEXT PRIMARY KEY,
        cloud_study_id TEXT,
        study_instance_uid TEXT NOT NULL UNIQUE,
        patient_id TEXT,
        patient_name TEXT,
        study_date TEXT,
        modalities TEXT,
        storage_path TEXT NOT NULL,
        file_count INTEGER DEFAULT 0,
        total_size INTEGER DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'RECEIVED',
        metadata TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_studies_uid ON studies(study_instance_uid);
      CREATE INDEX IF NOT EXISTS idx_studies_status ON studies(status);

      CREATE TABLE IF NOT EXISTS dicom_files (
        id TEXT PRIMARY KEY,
        study_id TEXT NOT NULL REFERENCES studies(id) ON DELETE CASCADE,
        series_uid TEXT NOT NULL,
        sop_uid TEXT NOT NULL UNIQUE,
        file_path TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        file_hash TEXT,
        is_video INTEGER DEFAULT 0,
        frame_count INTEGER,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_dicom_study ON dicom_files(study_id);

      CREATE TABLE IF NOT EXISTS sync_destinations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        is_default INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        config TEXT NOT NULL DEFAULT '{}',
        last_sync_at TEXT,
        last_sync_status TEXT,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS agent_state (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
  }
}
