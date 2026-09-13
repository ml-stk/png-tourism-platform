import { describe, expect, it, vi } from 'vitest';
import { NtdpCoreService } from './ntdp-core-service';

describe('NtdpCoreService', () => {
  const query = vi.fn();
  const service = new NtdpCoreService({ query } as any);

  it('snapshots registry operators into the analytical boundary', async () => {
    query.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [{ snapshot_date: '2026-09-14', operators: 5, active_operators: 4, compliant_operators: 3 }] });
    await expect(service.snapshotOperators('2026-09-14')).resolves.toMatchObject({ operators: 5, active_operators: 4, compliant_operators: 3 });
    expect(query).toHaveBeenCalledTimes(2);
  });

  it('records visitor events with governed metadata', async () => {
    query.mockResolvedValueOnce({ rows: [{ event_type: 'destination_view' }] });
    await expect(service.recordVisitorEvent({ eventType: 'destination_view', source: 'web', metadata: { campaign: 'test' } })).resolves.toMatchObject({ event_type: 'destination_view' });
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('returns commerce readiness without exposing secrets', async () => {
    query.mockResolvedValueOnce({ rows: [{ code: 'platform-ready', status: 'planned', capabilities: ['membership_fee'] }] });
    await expect(service.commerceReadiness()).resolves.toMatchObject({ transactionModel: 'commerce.transactions', credentialStorage: 'external-secret-manager', providers: [{ code: 'platform-ready' }] });
  });
});
