import type { UUID, ISODateString, Status } from './common';
import type { UserRole, Permission } from './auth';

export interface User {
  id: UUID;
  tenantId: UUID;
  clinicId?: UUID;
  email: string;
  name: string;
  role: UserRole;
  permissions: Permission[];
  status: Status;
  mfaEnabled: boolean;
  avatarUrl?: string;
  lastLoginAt?: ISODateString;
  lastLoginIp?: string;
  loginCount: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface CreateUserDto {
  email: string;
  name: string;
  role: UserRole;
  clinicId?: UUID;
  permissions?: Permission[];
}

export interface CreateUserResponse extends User {
  temporaryPassword: string;
}

export interface UpdateUserDto {
  email?: string;
  name?: string;
  role?: UserRole;
  clinicId?: UUID;
  permissions?: Permission[];
  status?: Status;
}

export interface ResetPasswordResponse {
  temporaryPassword: string;
}

export interface UserProfile {
  id: UUID;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  notifications: NotificationPreferences;
  dashboardLayout?: string;
}

export interface NotificationPreferences {
  emailOnExportComplete: boolean;
  emailOnExportFailed: boolean;
  emailOnEdgeAgentOffline: boolean;
  emailOnStorageFull: boolean;
  browserNotifications: boolean;
}
