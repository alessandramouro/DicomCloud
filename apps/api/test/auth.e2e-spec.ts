import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { resetDatabase, prisma } from './utils/db';
import { createTenant, createClinic, createUser } from './utils/fixtures';
import { createTestApp } from './utils/test-app';

describe('Auth (e2e)', () => {
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

  it('logs in with valid credentials and returns a usable access token', async () => {
    const tenant = await createTenant();
    const clinic = await createClinic(tenant.id);
    const { user, password } = await createUser(tenant.id, clinic.id);

    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: user.email, password })
      .expect(200);

    expect(loginRes.body.data.accessToken).toBeTruthy();
    expect(loginRes.body.data.user.email).toBe(user.email);

    const meRes = await request(app.getHttpServer())
      .get('/api/v1/studies')
      .set('Authorization', `Bearer ${loginRes.body.data.accessToken}`)
      .expect(200);

    expect(meRes.body.success).toBe(true);
  });

  it('rejects login with wrong password', async () => {
    const tenant = await createTenant();
    const clinic = await createClinic(tenant.id);
    const { user } = await createUser(tenant.id, clinic.id);

    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: 'WrongPassword@123' })
      .expect(401);
  });

  it('rejects an unauthenticated request to a protected route', async () => {
    await request(app.getHttpServer()).get('/api/v1/studies').expect(401);
  });
});
