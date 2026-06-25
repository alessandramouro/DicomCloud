import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { resetDatabase, prisma } from './utils/db';
import { createTenant, createClinic, createUser, createStorageDestination } from './utils/fixtures';
import { createTestApp } from './utils/test-app';

describe('Export jobs (e2e)', () => {
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

  /**
   * LOCAL/NFS/S3 destinations have no working connector yet (see export.processor.ts
   * UNSUPPORTED_DESTINATIONS) and are designed to fail fast via the Bull queue rather
   * than hang. This exercises that whole async path: HTTP create -> queue -> processor
   * -> markPermanentFailure -> job status readable again over HTTP.
   */
  it('fails fast for an unsupported destination type (LOCAL)', async () => {
    const tenant = await createTenant();
    const clinic = await createClinic(tenant.id);
    const { user, password } = await createUser(tenant.id, clinic.id);
    const destination = await createStorageDestination(tenant.id, clinic.id, 'LOCAL');

    const study = await prisma.study.create({
      data: {
        tenantId: tenant.id,
        clinicId: clinic.id,
        studyInstanceUid: `1.2.840.E2E.EXPORT.${Date.now()}`,
        storagePath: '/tmp/e2e-study',
        status: 'RECEIVED',
      },
    });

    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: user.email, password })
      .expect(200);
    const token = loginRes.body.data.accessToken;

    const createRes = await request(app.getHttpServer())
      .post(`/api/v1/exports/studies/${study.id}/destinations/${destination.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const jobId = createRes.body.data.id;
    expect(createRes.body.data.status).toBe('PENDING');

    const finalStatus = await pollJobStatus(app, token, jobId);

    expect(finalStatus.status).toBe('FAILED');
    expect(finalStatus.lastError).toContain('LOCAL');
  });
});

async function pollJobStatus(app: INestApplication, token: string, jobId: string) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/exports/${jobId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    if (res.body.data.status === 'FAILED' || res.body.data.status === 'COMPLETED') {
      return res.body.data;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Export job ${jobId} did not reach a terminal status in time`);
}
