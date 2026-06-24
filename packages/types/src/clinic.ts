import type { UUID, ISODateString, Status } from './common';
import type { StorageDestinationType } from './study';

export interface Clinic {
  id: UUID;
  tenantId: UUID;
  name: string;
  cnpj?: string;
  cnes?: string;
  address?: ClinicAddress;
  contact?: ClinicContact;
  status: Status;
  settings: ClinicSettings;
  storageDestinations?: StorageDestination[];
  edgeAgentCount: number;
  activeEdgeAgents: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface ClinicAddress {
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city: string;
  state: string;
  zipCode?: string;
  country: string;
}

export interface ClinicContact {
  phone?: string;
  email?: string;
  website?: string;
  responsibleName?: string;
  responsiblePhone?: string;
}

export interface ClinicSettings {
  timezone: string;
  dicomAeTitle: string;
  dicomPort: number;
  autoExportEnabled: boolean;
  exportOnComplete: boolean;
  retentionDays?: number;
  worklistEnabled: boolean;
  worklistHisUrl?: string;
  worklistAeTitle?: string;
  anonymizeOnExport: boolean;
}

export interface StorageDestination {
  id: UUID;
  clinicId: UUID;
  name: string;
  type: StorageDestinationType;
  isDefault: boolean;
  isActive: boolean;
  config: StorageDestinationConfig;
  lastSyncAt?: ISODateString;
  lastSyncStatus?: 'success' | 'failed' | 'partial';
  createdAt: ISODateString;
}

export type StorageDestinationConfig =
  | GoogleDriveConfig
  | OneDriveConfig
  | SmbConfig
  | NfsConfig
  | S3Config;

export interface GoogleDriveConfig {
  type: 'GOOGLE_DRIVE';
  folderId?: string;
  folderPath?: string;
  serviceAccountEmail?: string;
  oauthTokenId?: UUID;
}

export interface OneDriveConfig {
  type: 'ONEDRIVE';
  driveId?: string;
  folderPath?: string;
  oauthTokenId?: UUID;
}

export interface SmbConfig {
  type: 'SMB';
  host: string;
  port?: number;
  share: string;
  path?: string;
  username?: string;
  password?: string;
  domain?: string;
  version?: '2.0' | '2.1' | '3.0' | '3.1.1';
}

export interface NfsConfig {
  type: 'NFS';
  host: string;
  exportPath: string;
  mountOptions?: string;
}

export interface S3Config {
  type: 'S3';
  bucket: string;
  region: string;
  prefix?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  endpoint?: string;
}
