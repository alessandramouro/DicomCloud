import { Test } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AuditService', () => {
  let service: AuditService;
  let prisma: {
    tenant: { findUnique: jest.Mock };
    auditLog: { create: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      tenant: { findUnique: jest.fn() },
      auditLog: { create: jest.fn().mockResolvedValue({}) },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [AuditService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(AuditService);
  });

  it('writes the log when the tenant has not disabled audit logs', async () => {
    prisma.tenant.findUnique.mockResolvedValue({ features: { auditLogs: true } });

    await service.log({ tenantId: 'tenant-1', action: 'CREATE' });

    expect(prisma.auditLog.create).toHaveBeenCalledTimes(1);
  });

  it('writes the log when the tenant has no explicit auditLogs setting (default-on)', async () => {
    prisma.tenant.findUnique.mockResolvedValue({ features: {} });

    await service.log({ tenantId: 'tenant-1', action: 'CREATE' });

    expect(prisma.auditLog.create).toHaveBeenCalledTimes(1);
  });

  it('skips writing when the tenant explicitly disabled audit logs', async () => {
    prisma.tenant.findUnique.mockResolvedValue({ features: { auditLogs: false } });

    await service.log({ tenantId: 'tenant-1', action: 'CREATE' });

    expect(prisma.auditLog.create).not.toHaveBeenCalled();
  });

  it('falls back to the system tenant when no tenantId is given, and still respects its flag', async () => {
    prisma.tenant.findUnique.mockResolvedValue({ features: { auditLogs: false } });

    await service.log({ action: 'LOGIN_FAILED' });

    expect(prisma.tenant.findUnique).toHaveBeenCalledWith({
      where: { id: '00000000-0000-0000-0000-000000000001' },
      select: { features: true },
    });
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
  });

  it('never throws, even if the database call fails', async () => {
    prisma.tenant.findUnique.mockRejectedValue(new Error('db down'));

    await expect(service.log({ tenantId: 'tenant-1', action: 'CREATE' })).resolves.toBeUndefined();
  });
});
