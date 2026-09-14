import { describe, expect, it, vi } from 'vitest';
import type { IncomingMessage, ServerResponse } from 'node:http';

vi.mock('pg', () => ({ Pool: vi.fn() }));
vi.mock('./api', () => ({ authenticate: vi.fn().mockResolvedValue({ user: { id: 'user-1' } }) }));
vi.mock('../auth/authorization', () => ({ requirePermission: vi.fn() }));

const service = vi.hoisted(() => ({
  routes: vi.fn().mockResolvedValue([]), clients: vi.fn().mockResolvedValue([]), createClient: vi.fn(), transitionClient: vi.fn(),
  keys: vi.fn().mockResolvedValue([]), issueKey: vi.fn(), revokeKey: vi.fn(), usage: vi.fn().mockResolvedValue([]),
}));
vi.mock('../services/ntdp-api-gateway-service', () => ({ NtdpApiGatewayService: class { routes = service.routes; clients = service.clients; createClient = service.createClient; transitionClient = service.transitionClient; keys = service.keys; issueKey = service.issueKey; revokeKey = service.revokeKey; usage = service.usage; } }));

import { handleNtdpApiGatewayApi } from './ntdp-api-gateway-api';

type MockResponse = ServerResponse & { body?: string };
function request(method: string, path: string, headers: Record<string, string> = {}, body = ''): IncomingMessage { return { method, url: path, headers, [Symbol.asyncIterator]: async function* () { if (body) yield Buffer.from(body); } } as unknown as IncomingMessage; }
function response() { return { setHeader: vi.fn(), end(this: MockResponse, value?: string) { this.body = value; }, statusCode: 0 } as unknown as MockResponse; }

describe('NTDP API gateway administration', () => {
  it('requires authentication for gateway administration', async () => { const api = await import('./api'); vi.mocked(api.authenticate).mockRejectedValueOnce(Object.assign(new Error('no auth'), { code: 'UNAUTHORIZED' })); const res = response(); await handleNtdpApiGatewayApi(request('GET', '/api/v1/ntdp/gateway/routes'), res); expect(res.statusCode).toBe(401); });
  it('rejects malformed client creation', async () => { const api = await import('./api'); vi.mocked(api.authenticate).mockResolvedValue({ user: { id: 'user-1' } } as never); const res = response(); await handleNtdpApiGatewayApi(request('POST', '/api/v1/ntdp/gateway/clients', {}, '{}'), res); expect(res.statusCode).toBe(400); });
  it('requires gateway write permission for key issuance', async () => { const authz = await import('../auth/authorization'); vi.mocked(authz.requirePermission).mockImplementationOnce(() => { throw Object.assign(new Error('forbidden'), { code: 'FORBIDDEN' }); }); const res = response(); await handleNtdpApiGatewayApi(request('POST', '/api/v1/ntdp/gateway/keys', {}, JSON.stringify({ clientId: 'c1' })), res); expect(res.statusCode).toBe(403); });
  it('never exposes an issued key from a subsequent list operation', async () => { service.keys.mockResolvedValueOnce([{ id: 'k1', client_id: 'c1', key_prefix: 'pngtp_abc', status: 'active' }]); const res = response(); await handleNtdpApiGatewayApi(request('GET', '/api/v1/ntdp/gateway/keys'), res); expect(res.statusCode).toBe(200); expect(res.body).not.toContain('secret'); });
});
