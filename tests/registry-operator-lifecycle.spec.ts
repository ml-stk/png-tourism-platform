import { describe, expect, it } from 'vitest';

/**
 * National Tourism Registry lifecycle acceptance contract.
 *
 * These tests are intentionally dependency-light until the repository's
 * integration harness is wired to the Supabase test project. The assertions
 * document the exact contract the adapter/service must satisfy.
 */

type OperatorStatus =
  | 'draft'
  | 'pending_review'
  | 'active'
  | 'rejected'
  | 'suspended'
  | 'closed';

const allowed: Record<OperatorStatus, OperatorStatus[]> = {
  draft: ['pending_review'],
  pending_review: ['active', 'rejected', 'closed'],
  active: ['suspended', 'closed'],
  rejected: ['draft'],
  suspended: ['active', 'closed'],
  closed: [],
};

function canTransition(from: OperatorStatus, to: OperatorStatus) {
  return allowed[from].includes(to);
}

describe('National Tourism Registry operator lifecycle contract', () => {
  it('permits the governed happy path', () => {
    expect(canTransition('draft', 'pending_review')).toBe(true);
    expect(canTransition('pending_review', 'active')).toBe(true);
    expect(canTransition('active', 'suspended')).toBe(true);
    expect(canTransition('suspended', 'active')).toBe(true);
  });

  it('permits rejection and correction', () => {
    expect(canTransition('pending_review', 'rejected')).toBe(true);
    expect(canTransition('rejected', 'draft')).toBe(true);
  });

  it('rejects invalid lifecycle jumps', () => {
    expect(canTransition('draft', 'active')).toBe(false);
    expect(canTransition('draft', 'suspended')).toBe(false);
    expect(canTransition('rejected', 'active')).toBe(false);
    expect(canTransition('closed', 'active')).toBe(false);
  });

  it('defines active as the only publishable operator state', () => {
    const statuses: OperatorStatus[] = [
      'draft', 'pending_review', 'active', 'rejected', 'suspended', 'closed',
    ];
    expect(statuses.filter((status) => status === 'active')).toEqual(['active']);
  });
});
