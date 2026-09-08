import type { ID, ProvinceCode } from '../domain/types';

export type RoleCode =
  | 'platform_admin'
  | 'tpa_regulator'
  | 'content_manager'
  | 'provincial_admin'
  | 'operator'
  | 'analyst';

export type PermissionCode =
  | 'operator:read'
  | 'operator:register'
  | 'operator:approve'
  | 'operator:manage_compliance'
  | 'operator:manage_status'
  | 'content:read'
  | 'content:write'
  | 'content:publish'
  | 'intelligence:read'
  | 'admin:manage_users'
  | 'audit:read';

export interface AuthenticatedUser {
  id: ID;
  externalSubject: string;
  email: string;
  displayName: string;
  roles: RoleCode[];
  provinceCodes?: ProvinceCode[];
  operatorIds?: ID[];
}

export interface AuthorizationContext {
  user: AuthenticatedUser;
  requestId: string;
}
