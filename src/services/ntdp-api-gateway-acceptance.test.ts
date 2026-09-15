import { describe, expect, it, vi } from 'vitest';
import { NtdpApiGatewayService } from './ntdp-api-gateway-service';

function createService(rows: Record<string, unknown>[] = []) {
  const queries: { sql: string; params: unknown[] }[] = [];
  const pool = { query: vi.fn(async (sql: string, params: unknown[] = []) => {
    queries.push({ sql, params });
    if (sql.includes('from gateway.routes where method=$1')) return { rows };
    if (sql.includes('from gateway.routes where route_key=$1')) return { rows };
    if (sql.includes('from gateway.api_keys k join gateway.api_clients c')) return { rows };
    if (sql.includes('count(*)')) return { rows: [{ count: 0 }] };
    return { rows: [] };
  }) } as any;
  return { service: new NtdpApiGatewayService(pool), queries };
}

describe('NtdpApiGatewayService authorization acceptance', () => {
  it('allows an unkeyed request to an active public route', async () => {
    const { service } = createService([{ route_key: 'public-destination-list', visibility: 'public', required_scope: null, status: 'active', path_pattern: '/api/v1/public/destinations' }]);
    await expect(service.authorizeRequest({ method: 'GET', path: '/api/v1/public/destinations' })).resolves.toMatchObject({ routeKey: 'public-destination-list' });
  });

  it('rejects an unkeyed request to a protected route', async () => {
    const { service } = createService([{ route_key: 'gateway-usage', visibility: 'protected', required_scope: 'gateway:read', status: 'active', path_pattern: '/api/v1/ntdp/gateway/usage' }]);
    await expect(service.authorizeRequest({ method: 'GET', path: '/api/v1/ntdp/gateway/usage' })).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  it('rejects an unknown path rather than treating it as protected', async () => {
    const { service } = createService([{ route_key: 'public-destination-list', visibility: 'public', required_scope: null, status: 'active', path_pattern: '/api/v1/public/destinations' }]);
    await expect(service.authorizeRequest({ method: 'GET', path: '/api/v1/not-registered' })).resolves.toMatchObject({ routeKey: 'unregistered' });
  });

  it('matches parameterized routes without accepting extra path segments', async () => {
    const { service } = createService([{ route_key: 'public-destination-detail', visibility: 'public', required_scope: null, status: 'active', path_pattern: '/api/v1/public/destinations/{id}' }]);
    await expect(service.authorizeRequest({ method: 'GET', path: '/api/v1/public/destinations/abc' })).resolves.toMatchObject({ routeKey: 'public-destination-detail' });
    await expect(service.authorizeRequest({ method: 'GET', path: '/api/v1/public/destinations/abc/extra' })).resolves.toMatchObject({ routeKey: 'unregistered' });
  });

  it('does not allow a disabled route', async () => {
    const { service } = createService([]);
    await expect(service.authorizeRequest({ method: 'GET', path: '/api/v1/public/disabled' })).resolves.toMatchObject({ routeKey: 'unregistered' });
  });
});
