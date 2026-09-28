import { describe, expect, it } from 'vitest';
import { hasPermission } from './permissions';

describe('TPA regulator permissions', () => {
  it('can access governed TPA intelligence and editorial workspaces', () => {
    const role = ['tpa_regulator'] as const;
    expect(hasPermission(role, 'intelligence:read')).toBe(true);
    expect(hasPermission(role, 'content:read')).toBe(true);
    expect(hasPermission(role, 'content:write')).toBe(true);
    expect(hasPermission(role, 'content:publish')).toBe(true);
  });

  it('does not inherit platform administration authority', () => {
    expect(hasPermission(['tpa_regulator'], 'admin:manage_users')).toBe(false);
  });
});
