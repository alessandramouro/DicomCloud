import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction, Prisma } from '@prisma/client';

/** Used when no real tenant is resolvable (e.g. LOGIN_FAILED for an unknown/wrong-password attempt). Seeded by migration 20260624193425. */
const SYSTEM_TENANT_ID = '00000000-0000-0000-0000-000000000001';

interface AuditLogParams {
  tenantId?: string;
  clinicId?: string;
  userId?: string;
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  success?: boolean;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(params: AuditLogParams): Promise<void> {
    try {
      const tenantId = params.tenantId || SYSTEM_TENANT_ID;

      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { features: true },
      });
      const features = (tenant?.features as Record<string, boolean>) ?? {};
      if (features.auditLogs === false) return; // tenant explicitly opted out

      await this.prisma.auditLog.create({
        data: {
          tenantId,
          clinicId: params.clinicId,
          userId: params.userId,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          oldValues: params.oldValues as Prisma.InputJsonValue,
          newValues: params.newValues as Prisma.InputJsonValue,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
          requestId: params.requestId,
          success: params.success ?? true,
          errorMessage: params.errorMessage,
          metadata: params.metadata as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      // Audit logs must not break business flows
      this.logger.error(`Failed to write audit log: ${(error as Error).message}`);
    }
  }
}
