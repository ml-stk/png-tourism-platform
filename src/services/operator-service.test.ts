import { describe, expect, it } from 'vitest';
import type { Operator } from '../domain/types';
import { DomainError } from '../domain/errors';
import { OperatorService } from './operator-service';
import type { AuditWriter, OperatorRepository } from './contracts';

const base: Operator = {
  id: 'operator-1', legalName: 'PNG Paradise Tours Ltd', provinceCode: 'NCD',
  status: 'pending_review', complianceStatus: 'unknown',
  createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
};

function fixture(initial: Operator = base) {
  let current = { ...initial };
  const events: Array<{ action: string; metadata?: Record<string, unknown> }> = [];
  const repository: OperatorRepository = {
    async list() { return { items: [current] }; },
    async getById(id) { return id === current.id ? { ...current } : null; },
    async save(operator) { current = { ...operator }; return { ...current }; },
    async update(operator, expectedStatus) {
      if (expectedStatus && current.status !== expectedStatus) return null;
      current = { ...operator };
      return { ...current };
    },
  };
  const audit: AuditWriter = { async record(event) { events.push({ action: event.action, metadata: event.metadata }); } };
  return { service: new OperatorService(repository, audit), events, get: () => ({ ...current }) };
}

describe('OperatorService lifecycle', () => {
  it('approves pending registrations and audits the mutation', async () => {
    const f = fixture();
    const result = await f.service.approve(base.id, 'actor-1', 'request-1');
    expect(result.status).toBe('active');
    expect(f.events).toEqual([{ action: 'operator.approved', metadata: undefined }]);
  });

  it('rejects a pending registration only with a reason', async () => {
    const f = fixture();
    await expect(f.service.reject(base.id, '  Missing licence evidence  ', 'actor-1')).resolves.toMatchObject({ status: 'closed' });
    expect(f.events[0]).toEqual({ action: 'operator.rejected', metadata: { reason: 'Missing licence evidence' } });
    await expect(f.service.reject(base.id, '   ')).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('enforces lifecycle transition order', async () => {
    const f = fixture({ ...base, status: 'suspended' });
    await expect(f.service.approve(base.id)).rejects.toMatchObject({ code: 'CONFLICT' });
    await expect(f.service.suspend(base.id, 'Reason')).rejects.toMatchObject({ code: 'CONFLICT' });
    await expect(f.service.close(base.id, 'End of registration')).resolves.toMatchObject({ status: 'closed' });
  });

  it('updates compliance while preserving regulatory status', async () => {
    const f = fixture({ ...base, status: 'active' });
    const result = await f.service.updateCompliance(base.id, 'conditional', 'Annual review pending', 'actor-1');
    expect(result).toMatchObject({ status: 'active', complianceStatus: 'conditional' });
    expect(f.events[0]).toEqual({ action: 'operator.compliance_updated', metadata: { note: 'Annual review pending' } });
  });

  it('blocks compliance changes on closed operators', async () => {
    const f = fixture({ ...base, status: 'closed' });
    await expect(f.service.updateCompliance(base.id, 'compliant', undefined)).rejects.toMatchObject({ code: 'CONFLICT' });
  });
});
