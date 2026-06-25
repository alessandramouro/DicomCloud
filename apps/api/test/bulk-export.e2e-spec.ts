import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './utils/test-app';
import { resetDatabase, prisma } from './utils/db';
import { randomUUID } from 'crypto';
import { createTenant, createClinic, createUser, createStorageDestination } from './utils/fixtures';
import { waitFor } from './utils/wait-for';

describe('Bulk export (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  async function setup(bulkExportFeature: boolean) {
    const tenant = await createTenant({ features: { bulkExport: bulkExportFeature } });
    const clinic = await createClinic(tenant.id);
    const { user, password } = await createUser(tenant.id, clinic.id, { role: 'TENANT_ADMIN' });
    const destination = await createStorageDestination(tenant.id, clinic.id, 'GOOGLE_DRIVE');

    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: user.email, password })
      .expect(200);

    const studies = await Promise.all(
      [1, 2, 3].map((n) =>
        prisma.study.create({
          data: {
            tenantId: tenant.id,
            clinicId: clinic.id,
            studyInstanceUid: `1.2.840.E2E.BULK.${Date.now()}.${n}`,
            storagePath: `/tmp/bulk-${n}`,
            status: 'RECEIVED',
          },
        }),
      ),
    );

    return { token: loginRes.body.data.accessToken as string, tenant, clinic, destination, studies };
  }

  it('blocks bulk export when the tenant plan does not include it', async () => {
    const { token, destination, studies } = await setup(false);

    await request(app.getHttpServer())
      .post('/api/v1/exports/bulk')
      .set('Authorization', `Bearer ${token}`)
      .send({ studyIds: studies.map((s) => s.id), destinationId: destination.id })
      .expect(403);
  });

  it('creates one export job per study, all queued to the same destination', async () => {
    const { token, destination, studies } = await setup(true);

    const res = await request(app.getHttpServer())
      .post('/api/v1/exports/bulk')
      .set('Authorization', `Bearer ${token}`)
      .send({ studyIds: studies.map((s) => s.id), destinationId: destination.id })
      .expect(201);

    expect(res.body.data).toHaveLength(3);
    for (const entry of res.body.data) {
      expect(entry.jobId).toBeTruthy();
      expect(entry.error).toBeUndefined();
    }

    const jobs = await prisma.exportJob.findMany({ where: { studyId: { in: studies.map((s) => s.id) } } });
    expect(jobs).toHaveLength(3);
    expect(jobs.every((j) => j.destinationId === destination.id)).toBe(true);

    // These fixture studies have no edgeAgentId, so the queue worker (running for real
    // in this app instance) deterministically fails them shortly after — proves the
    // bulk-created jobs actually got picked up and processed, not just inserted.
    await waitFor(async () => {
      const updated = await prisma.exportJob.findMany({ where: { studyId: { in: studies.map((s) => s.id) } } });
      return updated.every((j) => j.status === 'FAILED');
    }, 10000);
  });

  it('reports a per-study error without failing the rest of the batch', async () => {
    const { token, destination, studies } = await setup(true);
    const nonExistentStudyId = randomUUID();

    const res = await request(app.getHttpServer())
      .post('/api/v1/exports/bulk')
      .set('Authorization', `Bearer ${token}`)
      .send({ studyIds: [studies[0].id, nonExistentStudyId], destinationId: destination.id })
      .expect(201);

    expect(res.body.data).toHaveLength(2);
    const [ok, failed] = res.body.data;
    expect(ok.jobId).toBeTruthy();
    expect(failed.studyId).toBe(nonExistentStudyId);
    expect(failed.error).toMatch(/not found/i);
  });

  it("rejects a destination that does not belong to the user's tenant", async () => {
    const { token, studies } = await setup(true);
    const other = await setup(true);

    await request(app.getHttpServer())
      .post('/api/v1/exports/bulk')
      .set('Authorization', `Bearer ${token}`)
      .send({ studyIds: studies.map((s) => s.id), destinationId: other.destination.id })
      .expect(404);
  });

  it('caps batch size at 200 study ids', async () => {
    const { token, destination } = await setup(true);
    const tooMany = Array.from({ length: 201 }, () => randomUUID());

    await request(app.getHttpServer())
      .post('/api/v1/exports/bulk')
      .set('Authorization', `Bearer ${token}`)
      .send({ studyIds: tooMany, destinationId: destination.id })
      .expect(400);
  });
});
