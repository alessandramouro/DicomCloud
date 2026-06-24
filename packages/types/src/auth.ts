import type { UUID, ISODateString } from './common';

export interface LoginRequest {
  email: string;
  password: string;
  mfaCode?: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
  user: AuthUser;
  requiresMfa?: boolean;
  mfaChallenge?: string;
  requiresPasswordChange?: boolean;
  passwordResetToken?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface AuthUser {
  id: UUID;
  email: string;
  name: string;
  role: UserRole;
  tenantId: UUID;
  clinicId?: UUID;
  permissions: Permission[];
  mfaEnabled: boolean;
  avatarUrl?: string;
}

export type UserRole =
  | 'SUPER_ADMIN'
  | 'TENANT_ADMIN'
  | 'CLINIC_ADMIN'
  | 'OPERATOR'
  | 'PHYSICIAN'
  | 'READONLY';

export type Permission =
  | 'tenants:read'
  | 'tenants:write'
  | 'tenants:delete'
  | 'clinics:read'
  | 'clinics:write'
  | 'clinics:delete'
  | 'users:read'
  | 'users:write'
  | 'users:delete'
  | 'studies:read'
  | 'studies:write'
  | 'studies:delete'
  | 'studies:export'
  | 'exports:read'
  | 'exports:manage'
  | 'storage:read'
  | 'storage:configure'
  | 'audit:read'
  | 'system:admin';

export interface JwtPayload {
  sub: UUID;
  email: string;
  role: UserRole;
  tenantId: UUID;
  clinicId?: UUID;
  permissions: Permission[];
  sessionId: UUID;
  iat: number;
  exp: number;
}

export interface MfaSetupResponse {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface Session {
  id: UUID;
  userId: UUID;
  deviceInfo?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: ISODateString;
  expiresAt: ISODateString;
  lastUsedAt: ISODateString;
}
