import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { resetDatabase, prisma } from './utils/db';
import { createTenant, createClinic, createUser, createEdgeAgent } from './utils/fixtures';
import { createTestApp } from './utils/test-app';

describe('Study ingest (e2e)', () => {
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

  it('accepts a study report from an edge agent and surfaces it to an authenticated user', async () => {
    const tenant = await createTenant();
    const clinic = await createClinic(tenant.id);
    const { agent, apiKey } = await createEdgeAgent(tenant.id, clinic.id);
    const { user, password } = await createUser(tenant.id, clinic.id);

    const studyInstanceUid = `1.2.840.E2E.${Date.now()}`;

    await request(app.getHttpServer())
      .post(`/api/v1/agents/${agent.id}/studies`)
      .set('x-agent-api-key', apiKey)
      .send({
        studyInstanceUid,
        patientName: 'E2E Patient',
        patientId: 'E2E-001',
        modalities: ['US'],
        fileCount: 3,
        totalSizeBytes: 1024,
      })
      .expect(201);

    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: user.email, password })
      .expect(200);

    const listRes = await request(app.getHttpServer())
      .get('/api/v1/studies')
      .query({ patientId: 'E2E-001' })
      .set('Authorization', `Bearer ${loginRes.body.data.accessToken}`)
      .expect(200);

    const studies = listRes.body.data.data;
    expect(studies).toHaveLength(1);
    expect(studies[0].studyInstanceUid).toBe(studyInstanceUid);
    expect(studies[0].modalities).toContain('US');
  });

  it('rejects a study report with an invalid agent API key', async () => {
    const tenant = await createTenant();
    const clinic = await createClinic(tenant.id);
    const { agent } = await createEdgeAgent(tenant.id, clinic.id);

    await request(app.getHttpServer())
      .post(`/api/v1/agents/${agent.id}/studies`)
      .set('x-agent-api-key', 'wrong-key')
      .send({ studyInstanceUid: '1.2.840.INVALID' })
      .expect(401);
  });
});
