import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { once } from 'node:events';
import { createApplicationServer } from './application';

const state = vi.hoisted(() => ({ role: 'operator', active: true, writes: [] as string[], registryQueries: [] as unknown[][] }));
vi.mock('pg', () => ({ Pool: class {
  async query(sql: string, params: unknown[] = []) {
    const result = (rows: unknown[]) => ({ rows, rowCount: rows.length });
    if (sql.startsWith('insert into users')) return result([{ id: 'user', is_active: state.active }]);
    if (sql.includes('select distinct r.code')) return result([{ code: state.role }]);
    if (sql.includes('from user_roles ur left join')) return result([{ operator_id: 'owned', province_code: 'NCD' }]);
    if (sql.includes('gateway.')) return result([]);
    if (sql.includes('from operators') && sql.includes('order by id')) state.registryQueries.push([sql, params]);
    if (sql.startsWith('update ') || sql.startsWith('insert ')) state.writes.push(sql);
    if (sql.startsWith('update tia_memberships')) return result([{ id: params[0], status: params[1] }]);
    if (sql.startsWith('select operator_id from')) return result([{ operator_id: params[0] === 'mine' ? 'owned' : 'foreign' }]);
    if (sql.includes('from tia_memberships')) return result([{ id: 'mine', operator_id: 'owned' }]);
    if (sql.includes('from sme_profiles')) return result([{ operator_id: params[0] }]);
    return result([]);
  }
} }));

describe('Assembled application security and routing', () => {
  const server = createApplicationServer();
  let base: string;
  beforeAll(async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('SUPABASE_URL', 'https://identity.test');
    vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', 'test-key');
    vi.stubEnv('CORS_ALLOWED_ORIGIN', 'https://allowed.test');
    vi.stubEnv('RATE_LIMIT_MAX_REQUESTS', '10000');
    const realFetch = globalThis.fetch;
    vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
      if (String(input).startsWith('https://identity.test/')) return Promise.resolve(new Response(JSON.stringify({ id: 'external-user', email: 'test@example.test', user_metadata: { roles: ['platform_admin'] } })));
      return realFetch(input, init);
    });
    server.listen(0, '127.0.0.1'); await once(server, 'listening');
    base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  });
  afterAll(async () => { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); vi.restoreAllMocks(); vi.unstubAllEnvs(); });
  beforeEach(() => { state.role = 'operator'; state.active = true; state.writes.length = 0; state.registryQueries.length = 0; });
  const request = (path: string, method = 'GET', body?: unknown, token = true) => fetch(base + path, {
    method, headers: { ...(token ? { Authorization: 'Bearer valid-session' } : {}), 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(3000),
  });

  it('restores public content and offline routes through the real dispatcher', async () => {
    expect((await request('/api/v1/public/content', 'GET', undefined, false)).status).toBe(200);
    expect((await request('/api/v1/public/offline/manifest?channel=kiosk', 'GET', undefined, false)).status).toBe(200);
  });
  it('authenticates the restored registry route and permits authority listing', async () => {
    expect((await request('/api/v1/operators', 'GET', undefined, false)).status).toBe(401);
    state.role = 'platform_admin';
    expect((await request('/api/v1/operators')).status).toBe(200);
  });
  it('requires an owned operator filter for membership lists', async () => {
    expect((await request('/api/v1/ntdp/membership')).status).toBe(403);
    expect((await request('/api/v1/ntdp/membership?operatorId=foreign')).status).toBe(403);
    expect((await request('/api/v1/ntdp/membership?operatorId=owned')).status).toBe(200);
  });
  it('binds registry lists to owned IDs even when a province is requested', async () => {
    expect((await request('/api/v1/operators?province=NCD')).status).toBe(200);
    expect(state.registryQueries[0][0]).toContain('id=any($1::uuid[])');
    expect((state.registryQueries[0][1] as unknown[])[0]).toEqual(['owned']);
  });
  it('does not accept a bearer token without the Bearer scheme', async () => {
    expect((await fetch(base + '/api/v1/operators', { headers: { Authorization: 'valid-session' } })).status).toBe(401);
  });
  it('fails closed for unscoped reports, distribution and global content', async () => {
    state.role = 'provincial_admin';
    expect((await request('/api/v1/command-centre/report?province=NCD')).status).toBe(403);
    expect((await request('/api/v1/ntdp/distribution/publications')).status).toBe(403);
    expect((await request('/api/v1/campaigns', 'POST', { title: 'Test', slug: 'test' })).status).toBe(403);
    expect((await request('/api/v1/content-studio/media', 'POST', { kind: 'image', storageKey: 'test', altText: 'Test', mimeType: 'image/png' })).status).toBe(403);
    expect(state.writes).toEqual([]);
  });
  it('never publishes campaigns through GET', async () => {
    state.role = 'platform_admin';
    expect((await request('/api/v1/campaigns/test/publish')).status).toBe(404);
    expect(state.writes).toEqual([]);
  });
  it('denies operator approval even for an owned membership and ignores user metadata roles', async () => {
    expect((await request('/api/v1/ntdp/membership/mine', 'PATCH', { status: 'active' })).status).toBe(403);
    expect(state.writes).toEqual([]);
  });
  it('allows an authority to approve a membership', async () => {
    state.role = 'tpa_regulator';
    expect((await request('/api/v1/ntdp/membership/mine', 'PATCH', { status: 'active' })).status).toBe(200);
  });
  it('denies foreign SME and commerce access without executing changes', async () => {
    expect((await request('/api/v1/ntdp/sme/foreign')).status).toBe(403);
    expect((await request('/api/v1/ntdp/commerce/transactions/foreign')).status).toBe(403);
    expect((await request('/api/v1/ntdp/commerce/transactions/mine', 'PATCH', { status: 'settled' })).status).toBe(403);
    expect(state.writes).toEqual([]);
  });
  it('reaches media and transaction creation validation rather than a prefix 404', async () => {
    state.role = 'platform_admin';
    expect((await request('/api/v1/content-studio/media', 'POST', {})).status).toBe(400);
    expect((await request('/api/v1/ntdp/commerce/transactions', 'POST', {})).status).toBe(400);
  });
  it('rejects disabled sessions consistently across industry, content and enterprise handlers', async () => {
    state.active = false;
    for (const path of ['/api/v1/industry/profiles/owned', '/api/v1/content-studio/media', '/api/v1/ntdp/membership']) expect((await request(path)).status).toBe(401);
  });
  it('rejects missing provincial scope', async () => {
    state.role = 'provincial_admin';
    expect((await request('/api/v1/ntdp/gis/assets')).status).toBe(403);
    expect((await request('/api/v1/ntdp/gis/assets?province=MOROBE')).status).toBe(403);
    expect((await request('/api/v1/ntdp/gis/assets?province=NCD')).status).toBe(200);
  });
  it('completes disallowed-origin responses and permits API-key preflight', async () => {
    expect((await fetch(base + '/health', { headers: { Origin: 'https://blocked.test' } })).status).toBe(403);
    const res = await fetch(base + '/api/v1/partner/content', { method: 'OPTIONS', headers: { Origin: 'https://allowed.test', 'Access-Control-Request-Headers': 'X-Api-Key' } });
    expect(res.status).toBe(204); expect(res.headers.get('access-control-allow-headers')).toContain('X-Api-Key');
  });
});
