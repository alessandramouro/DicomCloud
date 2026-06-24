-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING');

-- CreateEnum
CREATE TYPE "TenantPlan" AS ENUM ('FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "ClinicStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'TENANT_ADMIN', 'CLINIC_ADMIN', 'OPERATOR', 'PHYSICIAN', 'READONLY');

-- CreateEnum
CREATE TYPE "StudyStatus" AS ENUM ('RECEIVING', 'RECEIVED', 'PROCESSING', 'PROCESSED', 'QUEUED_EXPORT', 'EXPORTING', 'EXPORTED', 'EXPORT_FAILED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ExportJobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'RETRYING', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StorageDestinationType" AS ENUM ('GOOGLE_DRIVE', 'ONEDRIVE', 'SMB', 'NFS', 'S3', 'LOCAL');

-- CreateEnum
CREATE TYPE "EdgeAgentStatus" AS ENUM ('ONLINE', 'OFFLINE', 'DEGRADED', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'PASSWORD_RESET', 'MFA_ENABLED', 'MFA_DISABLED', 'EXPORT_STARTED', 'EXPORT_COMPLETED', 'EXPORT_FAILED', 'STUDY_RECEIVED', 'STUDY_DELETED', 'STORAGE_CONFIGURED', 'USER_INVITED', 'USER_SUSPENDED', 'PERMISSION_CHANGED', 'AGENT_REGISTERED', 'AGENT_REVOKED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('EMAIL', 'WEBHOOK', 'IN_APP');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'READ');

-- CreateEnum
CREATE TYPE "OAuthProvider" AS ENUM ('GOOGLE', 'MICROSOFT');

-- CreateEnum
CREATE TYPE "DicomModality" AS ENUM ('US', 'CT', 'MR', 'XR', 'CR', 'DR', 'NM', 'PET', 'MG', 'RF', 'OT');

-- CreateTable
CREATE TABLE "tenants" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
    "plan" "TenantPlan" NOT NULL DEFAULT 'FREE',
    "billingEmail" VARCHAR(255),
    "logoUrl" TEXT,
    "customDomain" TEXT,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "quotas" JSONB NOT NULL DEFAULT '{}',
    "features" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinics" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "cnpj" VARCHAR(18),
    "cnes" VARCHAR(20),
    "status" "ClinicStatus" NOT NULL DEFAULT 'ACTIVE',
    "addressStreet" VARCHAR(255),
    "addressNumber" VARCHAR(20),
    "addressComplement" VARCHAR(100),
    "addressNeighborhood" VARCHAR(100),
    "addressCity" VARCHAR(100) NOT NULL,
    "addressState" VARCHAR(2) NOT NULL,
    "addressZipCode" VARCHAR(10),
    "addressCountry" VARCHAR(3) NOT NULL DEFAULT 'BR',
    "contactPhone" VARCHAR(20),
    "contactEmail" VARCHAR(255),
    "contactWebsite" VARCHAR(255),
    "contactResponsible" VARCHAR(255),
    "contactResponsiblePhone" VARCHAR(20),
    "dicomAeTitle" VARCHAR(16) NOT NULL DEFAULT 'DICOMCLOUD',
    "dicomPort" INTEGER NOT NULL DEFAULT 104,
    "dicomAllowedCallingAeTitles" JSONB NOT NULL DEFAULT '[]',
    "timezone" VARCHAR(50) NOT NULL DEFAULT 'America/Sao_Paulo',
    "autoExportEnabled" BOOLEAN NOT NULL DEFAULT true,
    "exportOnComplete" BOOLEAN NOT NULL DEFAULT true,
    "retentionDays" INTEGER,
    "worklistEnabled" BOOLEAN NOT NULL DEFAULT false,
    "worklistHisUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "clinics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "clinicId" UUID,
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'READONLY',
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "permissions" JSONB NOT NULL DEFAULT '[]',
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mfaSecret" VARCHAR(255),
    "mfaBackupCodes" JSONB NOT NULL DEFAULT '[]',
    "avatarUrl" TEXT,
    "preferences" JSONB NOT NULL DEFAULT '{}',
    "lastLoginAt" TIMESTAMP(3),
    "lastLoginIp" VARCHAR(45),
    "loginCount" INTEGER NOT NULL DEFAULT 0,
    "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerifiedAt" TIMESTAMP(3),
    "verificationToken" TEXT,
    "verificationExpiry" TIMESTAMP(3),
    "passwordResetToken" TEXT,
    "passwordResetExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "sessionToken" VARCHAR(512) NOT NULL,
    "refreshToken" VARCHAR(512) NOT NULL,
    "deviceInfo" VARCHAR(500),
    "ipAddress" VARCHAR(45),
    "userAgent" VARCHAR(500),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "edge_agents" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "clinicId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "version" VARCHAR(50) NOT NULL,
    "status" "EdgeAgentStatus" NOT NULL DEFAULT 'OFFLINE',
    "apiKey" VARCHAR(512) NOT NULL,
    "apiKeyHash" VARCHAR(255) NOT NULL,
    "hostname" VARCHAR(255),
    "platform" VARCHAR(50),
    "osVersion" VARCHAR(100),
    "ipAddress" VARCHAR(45),
    "dicomAeTitle" VARCHAR(16) NOT NULL,
    "dicomPort" INTEGER NOT NULL,
    "dicomConfig" JSONB NOT NULL DEFAULT '{}',
    "lastMetrics" JSONB,
    "lastQueueStats" JSONB,
    "lastHeartbeatAt" TIMESTAMP(3),
    "lastSyncAt" TIMESTAMP(3),
    "remoteConfig" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "edge_agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "edge_agent_heartbeats" (
    "id" UUID NOT NULL,
    "agentId" UUID NOT NULL,
    "status" "EdgeAgentStatus" NOT NULL,
    "metrics" JSONB NOT NULL,
    "queueStats" JSONB NOT NULL,
    "ipAddress" VARCHAR(45),
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "edge_agent_heartbeats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storage_destinations" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "clinicId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "type" "StorageDestinationType" NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB NOT NULL DEFAULT '{}',
    "lastSyncAt" TIMESTAMP(3),
    "lastSyncStatus" VARCHAR(20),
    "totalSynced" BIGINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "storage_destinations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth_tokens" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "clinicId" UUID,
    "destinationId" UUID,
    "provider" "OAuthProvider" NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "accountEmail" VARCHAR(255),
    "accountId" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oauth_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "studies" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "clinicId" UUID NOT NULL,
    "edgeAgentId" UUID,
    "patientId" VARCHAR(100),
    "patientName" VARCHAR(255),
    "patientBirthDate" TIMESTAMP(3),
    "patientSex" VARCHAR(1),
    "studyInstanceUid" VARCHAR(64) NOT NULL,
    "accessionNumber" VARCHAR(50),
    "studyDate" TIMESTAMP(3),
    "studyTime" VARCHAR(20),
    "studyDescription" VARCHAR(255),
    "modalities" "DicomModality"[],
    "bodyPartsExamined" TEXT[],
    "status" "StudyStatus" NOT NULL DEFAULT 'RECEIVING',
    "storagePath" VARCHAR(1024) NOT NULL,
    "fileCount" INTEGER NOT NULL DEFAULT 0,
    "totalSizeBytes" BIGINT NOT NULL DEFAULT 0,
    "hash" VARCHAR(64),
    "institutionName" VARCHAR(255),
    "stationName" VARCHAR(100),
    "manufacturer" VARCHAR(255),
    "modelName" VARCHAR(255),
    "exportedAt" TIMESTAMP(3),
    "lastExportStatus" "ExportJobStatus",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "studies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dicom_files" (
    "id" UUID NOT NULL,
    "studyId" UUID NOT NULL,
    "seriesInstanceUid" VARCHAR(64) NOT NULL,
    "sopInstanceUid" VARCHAR(64) NOT NULL,
    "sopClassUid" VARCHAR(64),
    "transferSyntaxUid" VARCHAR(64),
    "fileName" VARCHAR(255) NOT NULL,
    "filePath" VARCHAR(1024) NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL DEFAULT 'application/dicom',
    "hash" VARCHAR(64) NOT NULL,
    "isVideo" BOOLEAN NOT NULL DEFAULT false,
    "frameCount" INTEGER,
    "thumbnailPath" VARCHAR(1024),
    "instanceNumber" INTEGER,
    "seriesNumber" INTEGER,
    "isAnonymized" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dicom_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dicom_metadata" (
    "id" UUID NOT NULL,
    "studyId" UUID NOT NULL,
    "seriesInstanceUid" VARCHAR(64),
    "sopInstanceUid" VARCHAR(64),
    "tags" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dicom_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "export_jobs" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "clinicId" UUID NOT NULL,
    "studyId" UUID NOT NULL,
    "destinationId" UUID NOT NULL,
    "destinationType" "StorageDestinationType" NOT NULL,
    "destinationPath" VARCHAR(1024),
    "status" "ExportJobStatus" NOT NULL DEFAULT 'PENDING',
    "priority" INTEGER NOT NULL DEFAULT 5,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "lastError" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "nextRetryAt" TIMESTAMP(3),
    "fileCount" INTEGER NOT NULL DEFAULT 0,
    "filesProcessed" INTEGER NOT NULL DEFAULT 0,
    "totalSizeBytes" BIGINT NOT NULL DEFAULT 0,
    "bytesTransferred" BIGINT NOT NULL DEFAULT 0,
    "transferSpeedBps" BIGINT,
    "progressPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "uploadState" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "export_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "export_job_logs" (
    "id" UUID NOT NULL,
    "exportJobId" UUID NOT NULL,
    "level" VARCHAR(10) NOT NULL,
    "message" TEXT NOT NULL,
    "meta" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "export_job_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_logs" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "clinicId" UUID NOT NULL,
    "edgeAgentId" UUID,
    "destinationId" UUID NOT NULL,
    "studyId" UUID,
    "action" VARCHAR(30) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "filesAttempted" INTEGER NOT NULL DEFAULT 0,
    "filesSucceeded" INTEGER NOT NULL DEFAULT 0,
    "filesFailed" INTEGER NOT NULL DEFAULT 0,
    "bytesTransferred" BIGINT NOT NULL DEFAULT 0,
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "clinicId" UUID,
    "userId" UUID,
    "action" "AuditAction" NOT NULL,
    "entityType" VARCHAR(100),
    "entityId" UUID,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" VARCHAR(45),
    "userAgent" VARCHAR(500),
    "requestId" VARCHAR(100),
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "clinicId" UUID,
    "userId" UUID,
    "type" "NotificationType" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "subject" VARCHAR(500) NOT NULL,
    "body" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "sentAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_configs" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "clinicId" UUID,
    "name" VARCHAR(255) NOT NULL,
    "url" VARCHAR(1024) NOT NULL,
    "secret" VARCHAR(255) NOT NULL,
    "events" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "retryAttempts" INTEGER NOT NULL DEFAULT 3,
    "timeoutSeconds" INTEGER NOT NULL DEFAULT 30,
    "lastDeliveryAt" TIMESTAMP(3),
    "lastDeliveryStatus" INTEGER,
    "deliveryCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "webhook_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" UUID NOT NULL,
    "tenantId" UUID,
    "clinicId" UUID,
    "key" VARCHAR(255) NOT NULL,
    "value" TEXT NOT NULL,
    "isSecret" BOOLEAN NOT NULL DEFAULT false,
    "description" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_customDomain_key" ON "tenants"("customDomain");

-- CreateIndex
CREATE INDEX "tenants_slug_idx" ON "tenants"("slug");

-- CreateIndex
CREATE INDEX "tenants_status_idx" ON "tenants"("status");

-- CreateIndex
CREATE INDEX "clinics_tenantId_idx" ON "clinics"("tenantId");

-- CreateIndex
CREATE INDEX "clinics_status_idx" ON "clinics"("status");

-- CreateIndex
CREATE INDEX "users_tenantId_idx" ON "users"("tenantId");

-- CreateIndex
CREATE INDEX "users_clinicId_idx" ON "users"("clinicId");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenantId_email_key" ON "users"("tenantId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_sessionToken_key" ON "user_sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_refreshToken_key" ON "user_sessions"("refreshToken");

-- CreateIndex
CREATE INDEX "user_sessions_userId_idx" ON "user_sessions"("userId");

-- CreateIndex
CREATE INDEX "user_sessions_sessionToken_idx" ON "user_sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "user_sessions_refreshToken_idx" ON "user_sessions"("refreshToken");

-- CreateIndex
CREATE UNIQUE INDEX "edge_agents_apiKey_key" ON "edge_agents"("apiKey");

-- CreateIndex
CREATE INDEX "edge_agents_tenantId_idx" ON "edge_agents"("tenantId");

-- CreateIndex
CREATE INDEX "edge_agents_clinicId_idx" ON "edge_agents"("clinicId");

-- CreateIndex
CREATE INDEX "edge_agents_status_idx" ON "edge_agents"("status");

-- CreateIndex
CREATE INDEX "edge_agent_heartbeats_agentId_idx" ON "edge_agent_heartbeats"("agentId");

-- CreateIndex
CREATE INDEX "edge_agent_heartbeats_timestamp_idx" ON "edge_agent_heartbeats"("timestamp");

-- CreateIndex
CREATE INDEX "storage_destinations_tenantId_idx" ON "storage_destinations"("tenantId");

-- CreateIndex
CREATE INDEX "storage_destinations_clinicId_idx" ON "storage_destinations"("clinicId");

-- CreateIndex
CREATE INDEX "storage_destinations_type_idx" ON "storage_destinations"("type");

-- CreateIndex
CREATE INDEX "oauth_tokens_tenantId_idx" ON "oauth_tokens"("tenantId");

-- CreateIndex
CREATE INDEX "oauth_tokens_destinationId_idx" ON "oauth_tokens"("destinationId");

-- CreateIndex
CREATE INDEX "studies_tenantId_idx" ON "studies"("tenantId");

-- CreateIndex
CREATE INDEX "studies_clinicId_idx" ON "studies"("clinicId");

-- CreateIndex
CREATE INDEX "studies_edgeAgentId_idx" ON "studies"("edgeAgentId");

-- CreateIndex
CREATE INDEX "studies_status_idx" ON "studies"("status");

-- CreateIndex
CREATE INDEX "studies_studyDate_idx" ON "studies"("studyDate");

-- CreateIndex
CREATE INDEX "studies_patientId_idx" ON "studies"("patientId");

-- CreateIndex
CREATE INDEX "studies_patientName_idx" ON "studies"("patientName");

-- CreateIndex
CREATE INDEX "studies_accessionNumber_idx" ON "studies"("accessionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "studies_tenantId_studyInstanceUid_key" ON "studies"("tenantId", "studyInstanceUid");

-- CreateIndex
CREATE INDEX "dicom_files_studyId_idx" ON "dicom_files"("studyId");

-- CreateIndex
CREATE INDEX "dicom_files_seriesInstanceUid_idx" ON "dicom_files"("seriesInstanceUid");

-- CreateIndex
CREATE UNIQUE INDEX "dicom_files_studyId_sopInstanceUid_key" ON "dicom_files"("studyId", "sopInstanceUid");

-- CreateIndex
CREATE INDEX "dicom_metadata_studyId_idx" ON "dicom_metadata"("studyId");

-- CreateIndex
CREATE INDEX "export_jobs_tenantId_idx" ON "export_jobs"("tenantId");

-- CreateIndex
CREATE INDEX "export_jobs_clinicId_idx" ON "export_jobs"("clinicId");

-- CreateIndex
CREATE INDEX "export_jobs_studyId_idx" ON "export_jobs"("studyId");

-- CreateIndex
CREATE INDEX "export_jobs_destinationId_idx" ON "export_jobs"("destinationId");

-- CreateIndex
CREATE INDEX "export_jobs_status_idx" ON "export_jobs"("status");

-- CreateIndex
CREATE INDEX "export_jobs_priority_status_idx" ON "export_jobs"("priority", "status");

-- CreateIndex
CREATE INDEX "export_job_logs_exportJobId_idx" ON "export_job_logs"("exportJobId");

-- CreateIndex
CREATE INDEX "export_job_logs_timestamp_idx" ON "export_job_logs"("timestamp");

-- CreateIndex
CREATE INDEX "sync_logs_tenantId_idx" ON "sync_logs"("tenantId");

-- CreateIndex
CREATE INDEX "sync_logs_clinicId_idx" ON "sync_logs"("clinicId");

-- CreateIndex
CREATE INDEX "sync_logs_destinationId_idx" ON "sync_logs"("destinationId");

-- CreateIndex
CREATE INDEX "sync_logs_createdAt_idx" ON "sync_logs"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_tenantId_idx" ON "audit_logs"("tenantId");

-- CreateIndex
CREATE INDEX "audit_logs_clinicId_idx" ON "audit_logs"("clinicId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "notifications_tenantId_idx" ON "notifications"("tenantId");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_status_idx" ON "notifications"("status");

-- CreateIndex
CREATE INDEX "webhook_configs_tenantId_idx" ON "webhook_configs"("tenantId");

-- CreateIndex
CREATE INDEX "system_settings_tenantId_idx" ON "system_settings"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_tenantId_clinicId_key_key" ON "system_settings"("tenantId", "clinicId", "key");

-- AddForeignKey
ALTER TABLE "clinics" ADD CONSTRAINT "clinics_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "edge_agents" ADD CONSTRAINT "edge_agents_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "edge_agent_heartbeats" ADD CONSTRAINT "edge_agent_heartbeats_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "edge_agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storage_destinations" ADD CONSTRAINT "storage_destinations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storage_destinations" ADD CONSTRAINT "storage_destinations_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauth_tokens" ADD CONSTRAINT "oauth_tokens_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauth_tokens" ADD CONSTRAINT "oauth_tokens_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "storage_destinations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "studies" ADD CONSTRAINT "studies_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "studies" ADD CONSTRAINT "studies_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "studies" ADD CONSTRAINT "studies_edgeAgentId_fkey" FOREIGN KEY ("edgeAgentId") REFERENCES "edge_agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dicom_files" ADD CONSTRAINT "dicom_files_studyId_fkey" FOREIGN KEY ("studyId") REFERENCES "studies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dicom_metadata" ADD CONSTRAINT "dicom_metadata_studyId_fkey" FOREIGN KEY ("studyId") REFERENCES "studies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_jobs" ADD CONSTRAINT "export_jobs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_jobs" ADD CONSTRAINT "export_jobs_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_jobs" ADD CONSTRAINT "export_jobs_studyId_fkey" FOREIGN KEY ("studyId") REFERENCES "studies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_jobs" ADD CONSTRAINT "export_jobs_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "storage_destinations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_job_logs" ADD CONSTRAINT "export_job_logs_exportJobId_fkey" FOREIGN KEY ("exportJobId") REFERENCES "export_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_logs" ADD CONSTRAINT "sync_logs_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_logs" ADD CONSTRAINT "sync_logs_edgeAgentId_fkey" FOREIGN KEY ("edgeAgentId") REFERENCES "edge_agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_logs" ADD CONSTRAINT "sync_logs_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "storage_destinations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "studies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_configs" ADD CONSTRAINT "webhook_configs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
