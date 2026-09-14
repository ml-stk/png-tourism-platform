import type { PermissionCode, RoleCode } from './types';
const ENTERPRISE = ['gis:read','gis:write','sme:read','sme:write','membership:read','membership:write','distribution:read','distribution:write','commerce:read','commerce:write','warehouse:read','warehouse:write'] as const;
const ROLE_PERMISSIONS: Record<RoleCode, readonly PermissionCode[]> = {
  platform_admin: ['operator:read','operator:register','operator:approve','operator:manage_profile','operator:manage_compliance','operator:manage_status','content:read','content:write','content:publish','intelligence:read','admin:manage_users','audit:read','gateway:read','gateway:write',...ENTERPRISE],
  tpa_regulator: ['operator:read','operator:register','operator:approve','operator:manage_profile','operator:manage_compliance','operator:manage_status','audit:read','membership:read','membership:write','commerce:read','commerce:write','warehouse:read','warehouse:write','gis:read','gis:write','distribution:read','distribution:write','gateway:read'],
  content_manager: ['content:read','content:write','content:publish','distribution:read','distribution:write'],
  provincial_admin: ['operator:read','operator:manage_profile','content:read','content:write','intelligence:read','gis:read','gis:write','sme:read','sme:write','distribution:read','distribution:write'],
  operator: ['operator:read','operator:manage_profile','sme:read','sme:write','membership:read','membership:write','commerce:read','commerce:write','gis:read','distribution:read'],
  analyst: ['content:read','intelligence:read','gis:read','sme:read','membership:read','distribution:read','commerce:read','warehouse:read'],
};
export function permissionsForRoles(roles: readonly RoleCode[]): Set<PermissionCode> { const permissions=new Set<PermissionCode>(); for(const role of roles) for(const permission of ROLE_PERMISSIONS[role]??[]) permissions.add(permission); return permissions; }
export function hasPermission(roles: readonly RoleCode[], permission: PermissionCode): boolean { return permissionsForRoles(roles).has(permission); }
