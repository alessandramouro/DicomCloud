-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'AGENT_ENROLLED';

-- AlterTable
ALTER TABLE "clinics" ADD COLUMN     "anonymizeOnExport" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "worklistAeTitle" VARCHAR(16);

-- CreateTable
CREATE TABLE "agent_enrollment_tokens" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "clinicId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "tokenHash" VARCHAR(64) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdByUserId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_enrollment_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agent_enrollment_tokens_tokenHash_key" ON "agent_enrollment_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "agent_enrollment_tokens_tenantId_idx" ON "agent_enrollment_tokens"("tenantId");

-- CreateIndex
CREATE INDEX "agent_enrollment_tokens_clinicId_idx" ON "agent_enrollment_tokens"("clinicId");

-- CreateIndex
CREATE INDEX "agent_enrollment_tokens_expiresAt_idx" ON "agent_enrollment_tokens"("expiresAt");

-- AddForeignKey
ALTER TABLE "agent_enrollment_tokens" ADD CONSTRAINT "agent_enrollment_tokens_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_enrollment_tokens" ADD CONSTRAINT "agent_enrollment_tokens_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_enrollment_tokens" ADD CONSTRAINT "agent_enrollment_tokens_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
