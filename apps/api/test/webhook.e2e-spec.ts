import { createHmac } from 'crypto';
import * as http from 'http';

import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { resetDatabase, prisma } from './utils/db';
import { createTenant, createClinic, createUser, createEdgeAgent } from './utils/fixtures';
import { createTestApp } from './utils/test-app';

describe('Webhooks (e2e)', () => {
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

  async function loginAsTenantAdmin(webhooksFeature: boolean) {
    const tenant = await createTenant({ features: { webhooks: webhooksFeature } });
    const clinic = await createClinic(tenant.id);
    const { user, password } = await createUser(tenant.id, clinic.id, { role: 'TENANT_ADMIN' });

    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: user.email, password })
      .expect(200);

    return { token: loginRes.body.data.accessToken as string, tenant, clinic };
  }

  describe('CRUD + plan gate', () => {
    it('blocks creation when the tenant plan does not include webhooks', async () => {
      const { token } = await loginAsTenantAdmin(false);

      await request(app.getHttpServer())
        .post('/api/v1/webhooks')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test', url: 'https://example.com/hook', events: ['study.received'] })
        .expect(403);
    });

    it('creates a webhook, returns the plaintext secret once, and omits it from subsequent reads', async () => {
      const { token } = await loginAsTenantAdmin(true);

      const createRes = await request(app.getHttpServer())
        .post('/api/v1/webhooks')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test', url: 'https://example.com/hook', events: ['study.received'] })
        .expect(201);

      expect(createRes.body.data.secret).toMatch(/^[a-f0-9]{64}$/);
      const webhookId = createRes.body.data.id;

      const listRes = await request(app.getHttpServer())
        .get('/api/v1/webhooks')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(listRes.body.data).toHaveLength(1);
      expect(listRes.body.data[0].secret).toBeUndefined();
      expect(listRes.body.data[0].id).toBe(webhookId);
    });

    it('updates, rotates the secret, and soft-deletes a webhook', async () => {
      const { token } = await loginAsTenantAdmin(true);

      const createRes = await request(app.getHttpServer())
        .post('/api/v1/webhooks')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test', url: 'https://example.com/hook', events: ['study.received'] })
        .expect(201);
      const webhookId = createRes.body.data.id;
      const originalSecret = createRes.body.data.secret;

      await request(app.getHttpServer())
        .patch(`/api/v1/webhooks/${webhookId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Renamed', isActive: false })
        .expect(200)
        .then((res) => {
          expect(res.body.data.name).toBe('Renamed');
          expect(res.body.data.isActive).toBe(false);
        });

      const rotateRes = await request(app.getHttpServer())
        .post(`/api/v1/webhooks/${webhookId}/rotate-secret`)
        .set('Authorization', `Bearer ${token}`)
        .expect(201);
      expect(rotateRes.body.data.secret).toMatch(/^[a-f0-9]{64}$/);
      expect(rotateRes.body.data.secret).not.toBe(originalSecret);

      await request(app.getHttpServer())
        .delete(`/api/v1/webhooks/${webhookId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      await request(app.getHttpServer())
        .patch(`/api/v1/webhooks/${webhookId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Should 404' })
        .expect(404);
    });

    it("a tenant cannot see or modify another tenant's webhook", async () => {
      const { token: tokenA } = await loginAsTenantAdmin(true);
      const { token: tokenB } = await loginAsTenantAdmin(true);

      const createRes = await request(app.getHttpServer())
        .post('/api/v1/webhooks')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Tenant A hook', url: 'https://example.com/hook', events: ['study.received'] })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/api/v1/webhooks/${createRes.body.data.id}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(404);

      const listRes = await request(app.getHttpServer())
        .get('/api/v1/webhooks')
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);
      expect(listRes.body.data).toHaveLength(0);
    });
  });

  describe('end-to-end delivery', () => {
    it('actually delivers a study.received webhook over HTTP with a valid HMAC signature', async () => {
      const received: Array<{ body: string; signature: string; event: string }> = [];

      const server = http.createServer((req, res) => {
        let body = '';
        req.on('data', (chunk) => { body += chunk; });
        req.on('end', () => {
          received.push({
            body,
            signature: req.headers['x-webhook-signature'] as string,
            event: req.headers['x-webhook-event'] as string,
          });
          res.writeHead(200);
          res.end('ok');
        });
      });
      await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
      const port = (server.address() as { port: number }).port;

      try {
        const { token, tenant, clinic } = await loginAsTenantAdmin(true);

        const createRes = await request(app.getHttpServer())
          .post('/api/v1/webhooks')
          .set('Authorization', `Bearer ${token}`)
          .send({
            name: 'E2E delivery test',
            url: `http://127.0.0.1:${port}/hook`,
            events: ['study.received'],
          })
          .expect(201);
        const secret = createRes.body.data.secret;

        const { agent, apiKey } = await createEdgeAgent(tenant.id, clinic.id);
        const studyInstanceUid = `1.2.840.E2E.WEBHOOK.${Date.now()}`;

        await request(app.getHttpServer())
          .post(`/api/v1/agents/${agent.id}/studies`)
          .set('x-agent-api-key', apiKey)
          .send({ studyInstanceUid, patientId: 'WEBHOOK-001' })
          .expect(201);

        const delivered = await waitFor(() => received.length > 0, 10000);
        expect(delivered).toBe(true);

        const [delivery] = received;
        expect(delivery.event).toBe('study.received');

        const expectedSignature = createHmac('sha256', secret).update(delivery.body).digest('hex');
        expect(delivery.signature).toBe(expectedSignature);

        const payload = JSON.parse(delivery.body);
        expect(payload.data.tenantId).toBe(tenant.id);
      } finally {
        await new Promise((resolve) => server.close(resolve));
      }
    });
  });
});

async function waitFor(predicate: () => boolean, timeoutMs: number): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (predicate()) return true;
    await new Promise((r) => setTimeout(r, 100));
  }
  return predicate();
}
