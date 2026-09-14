import { describe, expect, it, vi } from 'vitest';
import { NtdpCoreService } from './ntdp-core-service';

describe('NtdpCoreService regulatory lifecycle', () => {
  it('records a license status transition and syncs operator compliance', async () => {
    const query = vi.fn()
      .mockResolvedValueOnce({ rows: [{ status: 'under_review' }] })
      .mockResolvedValueOnce({ rows: [{ id: 'license-1', status: 'approved' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ affected: 1 }] });
    const service = new NtdpCoreService({ query } as any);
    await expect(service.reviewLicense({ licenseId: 'license-1', status: 'approved', reviewedBy: 'user-1', licenseNumber: 'LIC-001' })).resolves.toMatchObject({ status: 'approved' });
    expect(query).toHaveBeenCalledTimes(4);
  });

  it('rejects reopening a cancelled compliance action', async () => {
    const query = vi.fn().mockResolvedValueOnce({ rows: [{ status: 'cancelled' }] });
    const service = new NtdpCoreService({ query } as any);
    await expect(service.transitionComplianceAction({ actionId: 'action-1', status: 'open', changedBy: 'user-1' })).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('records inspection outcome history', async () => {
    const query = vi.fn()
      .mockResolvedValueOnce({ rows: [{ outcome: 'pending' }] })
      .mockResolvedValueOnce({ rows: [{ id: 'inspection-1', outcome: 'passed' }] })
      .mockResolvedValueOnce({ rows: [] });
    const service = new NtdpCoreService({ query } as any);
    await expect(service.updateInspection({ inspectionId: 'inspection-1', inspectorId: 'user-1', outcome: 'passed', reason: 'Requirements met' })).resolves.toMatchObject({ outcome: 'passed' });
    expect(query).toHaveBeenCalledTimes(3);
  });
});
