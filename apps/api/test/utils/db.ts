import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

/** Wipes all tenant data between specs, keeping the schema/migrations intact. */
export async function resetDatabase() {
  const tables: Array<{ tablename: string }> = await prisma.$queryRaw`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != '_prisma_migrations'
  `;

  if (tables.length === 0) return;

  const names = tables.map((t) => `"${t.tablename}"`).join(', ');

  // A background Bull worker in the same app instance can still be mid-query against
  // one of these tables when a test's beforeEach fires — TRUNCATE then loses a rare
  // race to Postgres's deadlock detector (40P01). Harmless; just retry once.
  try {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${names} CASCADE`);
  } catch {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${names} CASCADE`);
  }

  // AuditService.log() falls back to this sentinel tenant when no tenantId is resolvable
  // (e.g. failed login). Re-seed it since it was just wiped by the TRUNCATE above.
  await prisma.tenant.create({
    data: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'System',
      slug: 'system',
    },
  });
}
