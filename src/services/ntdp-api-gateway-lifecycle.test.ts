import { describe, expect, it } from 'vitest';
import { NtdpApiGatewayService } from './ntdp-api-gateway-service';

function poolFor(status: string) {
  const calls: string[] = [];
  const pool = {
    calls,
    query: async (sql: string, params: any[] = []) => {
      calls.push(sql);
      if (sql.includes('select id,status from gateway.api_clients')) return { rowCount: 1, rows: [{ id: 'client-1', status }] };
      if (sql.includes('update gateway.api_clients')) return { rowCount: 1, rows: [{ id: 'client-1', name: 'Test client', status: params[1], updated_at: new Date().toISOString() }] };
      return { rowCount: 1, rows: [] };
    },
  };
  return pool as any;
}

describe('NtdpApiGatewayService client lifecycle', () => {
  it('allows pending to approved', async () => {
    const service = new NtdpApiGatewayService(poolFor('pending'));
    await expect(service.transitionClient('client-1', 'approved', 'actor-1')).resolves.toMatchObject({ status: 'approved' });
  });

  it('allows approved to suspended and revoked', async () => {
    const suspended = new NtdpApiGatewayService(poolFor('approved'));
    await expect(suspended.transitionClient('client-1', 'suspended', 'actor-1')).resolves.toMatchObject({ status: 'suspended' });

    const revoked = new NtdpApiGatewayService(poolFor('approved'));
    await expect(revoked.transitionClient('client-1', 'revoked', 'actor-1')).resolves.toMatchObject({ status: 'revoked' });
  });

  it('allows suspended to approved and revoked', async () => {
    const approved = new NtdpApiGatewayService(poolFor('suspended'));
    await expect(approved.transitionClient('client-1', 'approved', 'actor-1')).resolves.toMatchObject({ status: 'approved' });

    const revoked = new NtdpApiGatewayService(poolFor('suspended'));
    await expect(revoked.transitionClient('client-1', 'revoked', 'actor-1')).resolves.toMatchObject({ status: 'revoked' });
  });

  it('rejects reopening or changing a revoked client', async () => {
    const service = new NtdpApiGatewayService(poolFor('revoked'));
    await expect(service.transitionClient('client-1', 'approved', 'actor-1')).rejects.toMatchObject({ code: 'CONFLICT' });
  });

  it('rejects skipping directly from pending to suspended', async () => {
    const service = new NtdpApiGatewayService(poolFor('pending'));
    await expect(service.transitionClient('client-1', 'suspended', 'actor-1')).rejects.toMatchObject({ code: 'CONFLICT' });
  });
});
