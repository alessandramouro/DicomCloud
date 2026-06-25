import type { UUID, ISODateString, Status } from './common';
import type { StorageDestinationType } from './study';

export interface Tenant {
  id: UUID;
  name: string;
  slug: string;
  status: Status;
  plan: TenantPlan;
  settings: TenantSettings;
  quotas: TenantQuotas;
  features: TenantFeatures;
  billingEmail?: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export type TenantPlan = 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';

export interface TenantSettings {
  timezone: string;
  locale: string;
  dateFormat: string;
  defaultStorageType?: StorageDestinationType;
  autoExportEnabled: boolean;
  retentionDays?: number;
  allowedModalities?: string[];
  customDomain?: string;
  logoUrl?: string;
}

export interface TenantQuotas {
  maxClinics: number;
  maxUsers: number;
  maxStorageGB: number;
  maxStudiesPerMonth?: number;
  maxEdgeAgents: number;
  usedStorageGB: number;
  studiesThisMonth: number;
}

export interface TenantFeatures {
  mfa: boolean;
  auditLogs: boolean;
  webhooks: boolean;
  dicomAnonymization: boolean;
  bulkExport: boolean;
  worklistEnabled: boolean;
}

export interface CreateTenantDto {
  name: string;
  slug: string;
  plan: TenantPlan;
  billingEmail?: string;
  adminEmail: string;
  adminName: string;
  adminPassword: string;
}

export interface UpdateTenantDto {
  name?: string;
  status?: Status;
  plan?: TenantPlan;
  settings?: Partial<TenantSettings>;
  features?: Partial<TenantFeatures>;
}
