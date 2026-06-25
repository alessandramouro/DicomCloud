-- AuditService.log() falls back to tenantId '00000000-0000-0000-0000-000000000001'
-- whenever a caller doesn't have a resolved tenant (e.g. LOGIN_FAILED, LOGOUT in
-- auth.service.ts). That row never existed, so the FK constraint on audit_logs.tenantId
-- silently rejected every one of those writes. This seeds the sentinel "system" tenant
-- the fallback already assumes exists.
INSERT INTO "tenants" ("id", "name", "slug", "status", "plan", "createdAt", "updatedAt")
VALUES ('00000000-0000-0000-0000-000000000001', 'System', 'system', 'ACTIVE', 'ENTERPRISE', now(), now())
ON CONFLICT ("id") DO NOTHING;
