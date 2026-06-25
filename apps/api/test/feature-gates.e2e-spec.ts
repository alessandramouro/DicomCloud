import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './utils/test-app';
import { resetDatabase, prisma } from './utils/db';
import { createTenant, createClinic, createUser, createEdgeAgent } from './utils/fixtures';

/**
 * Tenant.features is a per-tenant plan/feature-flag toggle set, editable from the
 * tenant admin UI. Most of those flags are currently cosmetic (stored but never read
 * by any guard/service) — see project memory for the full audit. This spec covers
 * the ones that are actually wired up to real gating logic, one at a time as they
 * get implemented.
 */
describe('Tenant feature gates (e2e)', () => {
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

  describe('MFA gate', () => {
    async function loginAs(role: 'TENANT_ADMIN', mfaFeature: boolean) {
      const tenant = await createTenant({ features: { mfa: mfaFeature } });
      const clinic = await createClinic(tenant.id);
      const { user, password } = await createUser(tenant.id, clinic.id, { role });

      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: user.email, password })
        .expect(200);

      return loginRes.body.data.accessToken as string;
    }

    it('blocks MFA setup when the tenant plan does not include it', async () => {
      const token = await loginAs('TENANT_ADMIN', false);

      await request(app.getHttpServer())
        .post('/api/v1/auth/mfa/setup')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('allows MFA setup when the tenant plan includes it', async () => {
      const token = await loginAs('TENANT_ADMIN', true);

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/mfa/setup')
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      expect(res.body.data.secret).toBeTruthy();
      expect(res.body.data.qrCodeUrl).toMatch(/^data:image/);
    });

    it('always allows SUPER_ADMIN to set up MFA, regardless of tenant plan', async () => {
      const tenant = await createTenant({ features: { mfa: false } });
      const clinic = await createClinic(tenant.id);
      const { user, password } = await createUser(tenant.id, clinic.id, { role: 'SUPER_ADMIN' });

      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: user.email, password })
        .expect(200);
      const token = loginRes.body.data.accessToken;

      await request(app.getHttpServer())
        .post('/api/v1/auth/mfa/setup')
        .set('Authorization', `Bearer ${token}`)
        .expect(201);
    });
  });

  describe('Worklist gate (runtime-config served to the edge agent)', () => {
    async function setupAgent(
      tenantFeature: boolean,
      clinicOverrides: Parameters<typeof createClinic>[1] = {},
    ) {
      const tenant = await createTenant({ features: { worklistEnabled: tenantFeature } });
      const clinic = await createClinic(tenant.id, clinicOverrides);
      const { agent, apiKey } = await createEdgeAgent(tenant.id, clinic.id);
      return { agent, apiKey };
    }

    async function fetchRuntimeConfig(agentId: string, apiKey: string) {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/agents/${agentId}/runtime-config`)
        .set('x-agent-api-key', apiKey)
        .expect(200);
      return res.body.data.worklist;
    }

    it('disables worklist when the tenant plan does not include it, even if the clinic configured it', async () => {
      const { agent, apiKey } = await setupAgent(false, {
        worklistEnabled: true,
        worklistHisUrl: 'his.example.com:104',
        worklistAeTitle: 'HIS_SCP',
      });

      const worklist = await fetchRuntimeConfig(agent.id, apiKey);
      expect(worklist.enabled).toBe(false);
    });

    it('disables worklist when the tenant plan allows it but the clinic has not turned it on', async () => {
      const { agent, apiKey } = await setupAgent(true, {
        worklistEnabled: false,
        worklistHisUrl: 'his.example.com:104',
      });

      const worklist = await fetchRuntimeConfig(agent.id, apiKey);
      expect(worklist.enabled).toBe(false);
    });

    it('disables worklist when the clinic has no HIS URL configured', async () => {
      const { agent, apiKey } = await setupAgent(true, { worklistEnabled: true });

      const worklist = await fetchRuntimeConfig(agent.id, apiKey);
      expect(worklist.enabled).toBe(false);
    });

    it('enables worklist and returns HIS connection details when tenant plan, clinic toggle, and HIS URL all line up', async () => {
      const { agent, apiKey } = await setupAgent(true, {
        worklistEnabled: true,
        worklistHisUrl: 'his.example.com:104',
        worklistAeTitle: 'HIS_SCP',
      });

      const worklist = await fetchRuntimeConfig(agent.id, apiKey);
      expect(worklist.enabled).toBe(true);
      expect(worklist.hisUrl).toBe('his.example.com:104');
      expect(worklist.aeTitle).toBe('HIS_SCP');
    });
  });
});
