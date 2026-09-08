import type { PermissionCode, RoleCode } from './types';

const ROLE_PERMISSIONS: Record<RoleCode, readonly PermissionCode[]> = {
  platform_admin: [
    'operator:read','operator:register','operator:approve','operator:manage_compliance','operator:manage_status',
    'content:read','content:write','content:publish','intelligence:read',
    'admin:manage_users','audit:read',
  ],
  tpa_regulator: ['operator:read','operator:register','operator:approve','operator:manage_compliance','operator:manage_status','audit:read'],
  content_manager: ['content:read','content:write','content:publish'],
  provincial_admin: ['operator:read','content:read','content:write','intelligence:read'],
  operator: ['operator:read'],
  analyst: ['content:read','intelligence:read'],
};

export function permissionsForRoles(roles: readonly RoleCode[]): Set<PermissionCode> {
  const permissions = new Set<PermissionCode>();
  for (const role of roles) {
    for (const permission of ROLE_PERMISSIONS[role] ?? []) permissions.add(permission);
  }
  return permissions;
}

export function hasPermission(roles: readonly RoleCode[], permission: PermissionCode): boolean {
  return permissionsForRoles(roles).has(permission);
}
