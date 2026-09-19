import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { NtdpApiGatewayService } from './ntdp-api-gateway-service';

function poolFor(route: any, client: any = null) {
  const calls: string[] = [];
  const pool = {
    calls,
    query: async (sql: string, params: any[] = []) => {
      calls.push(sql);
      if (sql.includes('from gateway.routes where method=$1')) return { rows: route ? [route] : [] };
      if (sql.includes('from gateway.routes where route_key=$1')) return { rows: route ? [route] : [] };
      if (sql.includes('from gateway.api_keys k join gateway.api_clients c')) return { rows: client ? [client] : [] };
      if (sql.includes('update gateway.api_keys set last_used_at')) return { rowCount: 1, rows: [] };
      if (sql.includes('from gateway.request_log where client_id=$1')) return { rows: [{ count: client?.requestCount ?? 0 }] };
      return { rowCount: 1, rows: [] };
    },
  };
  return pool as any;
}

const publicRoute = { route_key: 'public-destination-detail', visibility: 'public', required_scope: null, status: 'active', path_pattern: '/api/v1/public/destinations/{id}' };
const protectedRoute = { route_key: 'gateway-usage', visibility: 'protected', required_scope: 'gateway:read', status: 'active', path_pattern: '/api/v1/ntdp/gateway/usage' };
const validKey = 'pngtp_test-key';
const validHash = createHash('sha256').update(validKey).digest('hex');
const approvedClient = { api_key_id: 'key-1', client_id: 'client-1', client_status: 'approved', rate_limit_per_minute: 60, allowed_scopes: ['gateway:read'], expires_at: null };

describe('NtdpApiGatewayService authorization', () => {
  it('allows a registered public route without an API key', async () => {
    const service = new NtdpApiGatewayService(poolFor(publicRoute));
    await expect(service.authorizeRequest({ method: 'GET', path: '/api/v1/public/destinations/abc' })).resolves.toEqual({ routeKey: 'public-destination-detail' });
  });

  it('requires an API key for protected routes', async () => {
    const service = new NtdpApiGatewayService(poolFor(protectedRoute));
    await expect(service.authorizeRequest({ method: 'GET', path: '/api/v1/ntdp/gateway/usage' })).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  it('rejects a valid key when the required scope is missing', async () => {
    const client = { ...approvedClient, allowed_scopes: [] };
    const service = new NtdpApiGatewayService(poolFor(protectedRoute, client));
    await expect(service.authorizeRequest({ method: 'GET', path: '/api/v1/ntdp/gateway/usage', apiKey: validKey })).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('authorizes an approved key with the required scope and records key use', async () => {
    const service = new NtdpApiGatewayService(poolFor(protectedRoute, { ...approvedClient, key_hash: validHash }));
    await expect(service.authorizeRequest({ method: 'GET', path: '/api/v1/ntdp/gateway/usage', apiKey: validKey })).resolves.toEqual({ routeKey: 'gateway-usage', clientId: 'client-1', apiKeyId: 'key-1' });
  });

  it('rejects an expired key', async () => {
    const client = { ...approvedClient, expires_at: '2020-01-01T00:00:00Z' };
    const service = new NtdpApiGatewayService(poolFor(protectedRoute, client));
    await expect(service.authorizeRequest({ method: 'GET', path: '/api/v1/ntdp/gateway/usage', apiKey: validKey })).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  it('rejects a revoked key', async () => {
    const service = new NtdpApiGatewayService({
      query: async (sql: string) => {
        if (sql.includes('from gateway.routes where method=$1')) return { rows: [protectedRoute] };
        if (sql.includes('from gateway.api_keys k join gateway.api_clients c')) return { rows: [] };
        return { rowCount: 1, rows: [] };
      },
    } as any);
    await expect(service.authorizeRequest({ method: 'GET', path: '/api/v1/ntdp/gateway/usage', apiKey: validKey })).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  it('rejects a client that has reached its minute rate limit', async () => {
    const client = { ...approvedClient, rate_limit_per_minute: 2, requestCount: 2 };
    const service = new NtdpApiGatewayService(poolFor(protectedRoute, client));
    await expect(service.authorizeRequest({ method: 'GET', path: '/api/v1/ntdp/gateway/usage', apiKey: validKey })).rejects.toMatchObject({ code: 'RATE_LIMITED' });
  });

  it('keeps approved-partner routes distinct from public paths', async () => {
    const routes = [
      { route_key: 'public-destinations', visibility: 'public', required_scope: null, status: 'active', path_pattern: '/api/v1/public/destinations' },
      { route_key: 'partner-destinations', visibility: 'approved_partner', required_scope: 'destinations:read', status: 'active', path_pattern: '/api/v1/partner/destinations' },
    ];
    const service = new NtdpApiGatewayService({
      query: async (sql: string) => sql.includes('from gateway.routes where method=$1') ? { rows: routes } : { rowCount: 1, rows: [] },
    } as any);
    await expect(service.authorizeRequest({ method: 'GET', path: '/api/v1/partner/destinations' })).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });
});
