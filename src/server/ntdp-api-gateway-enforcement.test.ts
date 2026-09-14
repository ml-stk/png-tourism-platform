import { describe, expect, it, vi } from 'vitest';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleNtdpApiGatewayApi } from './ntdp-api-gateway-api';

const service = vi.hoisted(() => ({
  routes: vi.fn().mockResolvedValue([]), clients: vi.fn().mockResolvedValue([]), createClient: vi.fn(),
  transitionClient: vi.fn(), keys: vi.fn().mockResolvedValue([]), issueKey: vi.fn(), revokeKey: vi.fn(),
  usage: vi.fn().mockResolvedValue([]), authenticateApiKey: vi.fn(), logRequest: vi.fn(),
}));

vi.mock('../services/ntdp-api-gateway-service', () => ({
  NtdpApiGatewayService: class {
    routes(...args: any[]) { return service.routes(...args); }
    clients(...args: any[]) { return service.clients(...args); }
    createClient(...args: any[]) { return service.createClient(...args); }
    transitionClient(...args: any[]) { return service.transitionClient(...args); }
    keys(...args: any[]) { return service.keys(...args); }
    issueKey(...args: any[]) { return service.issueKey(...args); }
    revokeKey(...args: any[]) { return service.revokeKey(...args); }
    usage(...args: any[]) { return service.usage(...args); }
    authenticateApiKey(...args: any[]) { return service.authenticateApiKey(...args); }
    logRequest(...args: any[]) { return service.logRequest(...args); }
  },
}));
vi.mock('pg', () => ({ Pool: vi.fn() }));
vi.mock('./api', () => ({ authenticate: vi.fn().mockResolvedValue({ user: { id: 'user-1' } }) }));
vi.mock('../auth/authorization', () => ({ requirePermission: vi.fn() }));

type MockResponse = ServerResponse & { body?: string };
function request(method: string, path: string, headers: Record<string, string> = {}, body = ''): IncomingMessage {
  return { method, url: path, headers, [Symbol.asyncIterator]: async function* () { if (body) yield Buffer.from(body); } } as unknown as IncomingMessage;
}
function response() { return { setHeader: vi.fn(), end(this: MockResponse, value?: string) { this.body = value; }, statusCode: 0 } as unknown as MockResponse; }

describe('NTDP API gateway administration', () => {
  it('requires authentication for gateway administration', async () => {
    const api = await import('./api');
    vi.mocked(api.authenticate).mockRejectedValueOnce(Object.assign(new Error('no auth'), { code: 'UNAUTHORIZED' }));
    const res = response(); await handleNtdpApiGatewayApi(request('GET', '/api/v1/ntdp/gateway/routes'), res);
    expect(res.statusCode).toBe(401);
  });
  it('rejects malformed client creation', async () => {
    const api = await import('./api');
    vi.mocked(api.authenticate).mockResolvedValue({ user: { id: 'user-1' } } as never);
    const res = response(); await handleNtdpApiGatewayApi(request('POST', '/api/v1/ntdp/gateway/clients', {}, '{}'), res);
    expect(res.statusCode).toBe(400);
  });
  it('requires gateway write permission for key issuance', async () => {
    const authz = await import('../auth/authorization');
    vi.mocked(authz.requirePermission).mockImplementationOnce(() => { throw Object.assign(new Error('forbidden'), { code: 'FORBIDDEN' }); });
    const res = response(); await handleNtdpApiGatewayApi(request('POST', '/api/v1/ntdp/gateway/keys', {}, JSON.stringify({ clientId: 'c1' })), res);
    expect(res.statusCode).toBe(403);
  });
  it('never exposes an issued key from a subsequent list operation', async () => {
    service.keys.mockResolvedValueOnce([{ id: 'k1', client_id: 'c1', key_prefix: 'pngtp_abc', status: 'active' }]);
    const res = response(); await handleNtdpApiGatewayApi(request('GET', '/api/v1/ntdp/gateway/keys'), res);
    expect(res.statusCode).toBe(200); expect(res.body).not.toContain('secret');
  });
});
