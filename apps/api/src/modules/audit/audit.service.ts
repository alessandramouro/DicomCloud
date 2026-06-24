import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction, Prisma } from '@prisma/client';

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
      await this.prisma.auditLog.create({
        data: {
          tenantId: params.tenantId || '00000000-0000-0000-0000-000000000001',
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
