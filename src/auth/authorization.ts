import { DomainError } from '../domain/errors';
import type { ID, ProvinceCode } from '../domain/types';
import { hasPermission } from './permissions';
import type { AuthorizationContext, PermissionCode } from './types';

export function requirePermission(
  context: AuthorizationContext,
  permission: PermissionCode,
): void {
  if (!hasPermission(context.user.roles, permission)) {
    throw new DomainError('FORBIDDEN', `Permission denied: ${permission}`);
  }
}

export function requireProvinceAccess(
  context: AuthorizationContext,
  provinceCode: ProvinceCode,
): void {
  if (context.user.roles.includes('platform_admin') || context.user.roles.includes('tpa_regulator')) return;
  if (context.user.provinceCodes?.includes(provinceCode)) return;
  throw new DomainError('FORBIDDEN', `Province access denied: ${provinceCode}`);
}

export function requireOperatorAccess(context: AuthorizationContext, operatorId: ID): void {
  if (context.user.roles.includes('platform_admin') || context.user.roles.includes('tpa_regulator')) return;
  if (context.user.operatorIds?.includes(operatorId)) return;
  throw new DomainError('FORBIDDEN', `Operator access denied: ${operatorId}`);
}
