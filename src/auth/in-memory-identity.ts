import type { ID } from '../domain/types';
import type { AuthenticatedUser, RoleCode } from './types';

export interface IdentityRecord extends AuthenticatedUser {
  disabled?: boolean;
}

/** Development/test identity adapter. Production authentication must be supplied by an external IdP. */
export class InMemoryIdentityStore {
  private readonly users = new Map<ID, IdentityRecord>();

  upsert(user: IdentityRecord): void {
    this.users.set(user.id, { ...user, roles: [...user.roles] });
  }

  findByExternalSubject(externalSubject: string): AuthenticatedUser | undefined {
    const user = [...this.users.values()].find((candidate) => candidate.externalSubject === externalSubject);
    if (!user || user.disabled) return undefined;
    return { ...user, roles: [...user.roles] };
  }

  assignRole(userId: ID, role: RoleCode): void {
    const user = this.users.get(userId);
    if (!user) throw new Error(`Unknown user: ${userId}`);
    if (!user.roles.includes(role)) user.roles.push(role);
  }
}
