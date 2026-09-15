import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { NtdpApiGatewayService } from './ntdp-api-gateway-service';

const key = 'pngtp_test-key';
const hash = createHash('sha256').update(key).digest('hex');
const route = { route_key: 'gateway-usage', visibility: 'protected', required_scope: 'gateway:read', status: 'active', path_pattern: '/api/v1/ntdp/gateway/usage' };
const baseClient = { api_key_id: 'key-1', client_id: 'client-1', client_status: 'approved', rate_limit_per_minute: 60, allowed_scopes: ['gateway:read'], expires_at: null, key_hash: hash };

function poolFor(client: any) {
  const pool = {
    query: async (sql: string) => {
      if (sql.includes('from gateway.routes where method=$1')) return { rows: [route] };
      if (sql.includes('from gateway.routes where route_key=$1')) return { rows: [route] };
      if (sql.includes('from gateway.api_keys k join gateway.api_clients c')) return { rows: client ? [client] : [] };
      if (sql.includes('from gateway.request_log where client_id=$1')) return { rows: [{ count: 0 }] };
      return { rowCount: 1, rows: [] };
    },
  };
  return pool as any;
}

describe('NtdpApiGatewayService API key lifecycle', () => {
  it('rejects a revoked key', async () => {
    const service = new NtdpApiGatewayService(poolFor(null));
    await expect(service.authenticateApiKey(key)).resolves.toBeNull();
  });

  it('rejects a key belonging to a suspended client', async () => {
    const service = new NtdpApiGatewayService(poolFor({ ...baseClient, client_status: 'suspended' }));
    await expect(service.authenticateApiKey(key)).resolves.toBeNull();
  });

  it('rejects an expired key at authorization time', async () => {
    const service = new NtdpApiGatewayService(poolFor({ ...baseClient, expires_at: '2020-01-01T00:00:00Z' }));
    await expect(service.authorizeRequest({ method: 'GET', path: route.path_pattern, apiKey: key })).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  it('authorizes an active key for an approved client with the required scope', async () => {
    const service = new NtdpApiGatewayService(poolFor(baseClient));
    await expect(service.authorizeRequest({ method: 'GET', path: route.path_pattern, apiKey: key })).resolves.toMatchObject({ routeKey: 'gateway-usage', clientId: 'client-1', apiKeyId: 'key-1' });
  });
});
