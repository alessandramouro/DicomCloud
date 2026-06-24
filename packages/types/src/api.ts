import type { UUID } from './common';

export interface WebhookPayload<T = unknown> {
  id: UUID;
  event: WebhookEvent;
  tenantId: UUID;
  clinicId?: UUID;
  data: T;
  timestamp: string;
  version: '1';
}

export type WebhookEvent =
  | 'study.received'
  | 'study.processed'
  | 'export.completed'
  | 'export.failed'
  | 'agent.online'
  | 'agent.offline'
  | 'storage.quota_warning'
  | 'storage.quota_exceeded';

export interface WebhookConfig {
  id: UUID;
  clinicId: UUID;
  url: string;
  secret: string;
  events: WebhookEvent[];
  isActive: boolean;
  retryAttempts: number;
  lastDeliveryAt?: string;
  lastDeliveryStatus?: number;
}

export interface TelemetryEvent {
  agentId: UUID;
  type: TelemetryEventType;
  data: Record<string, unknown>;
  timestamp: string;
}

export type TelemetryEventType =
  | 'heartbeat'
  | 'study_received'
  | 'study_processed'
  | 'export_started'
  | 'export_completed'
  | 'export_failed'
  | 'error'
  | 'warning';

export interface HealthCheck {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  version: string;
  uptime: number;
  services: Record<string, ServiceHealth>;
}

export interface ServiceHealth {
  status: 'ok' | 'degraded' | 'down';
  latencyMs?: number;
  message?: string;
}
