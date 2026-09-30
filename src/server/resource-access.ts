import type { Pool } from 'pg';
import type { AuthorizationContext } from '../auth/types';
import type { ProvinceCode } from '../domain/types';
import { requireOperatorAccess, requireProvinceAccess } from '../auth/authorization';

export function isAuthority(context: AuthorizationContext): boolean {
  return context.user.roles.some(role => role === 'platform_admin' || role === 'tpa_regulator');
}

export function requireAuthority(context: AuthorizationContext): void {
  if (!isAuthority(context)) forbidden('Authority permission required');
}

export function canReadNational(context: AuthorizationContext): boolean {
  return isAuthority(context) || context.user.roles.includes('analyst');
}

export function requireProvinceFilter(context: AuthorizationContext, province?: ProvinceCode): void {
  if (canReadNational(context)) return;
  if (!province) forbidden('A permitted province is required');
  requireProvinceAccess(context, province);
}

export async function requireOwnedOperator(pool: Pool, context: AuthorizationContext, operatorId: string, readOnly = false): Promise<void> {
  if (isAuthority(context) || (readOnly && context.user.roles.includes('analyst'))) return;
  if (context.user.roles.includes('operator')) {
    requireOperatorAccess(context, operatorId);
    return;
  }
  const result = await pool.query('select province_code from operators where id=$1', [operatorId]);
  if (!result.rows[0]) forbidden('Operator access denied');
  requireProvinceAccess(context, result.rows[0].province_code);
}

const resourceTables = { membership: 'tia_memberships', sme: 'sme_profiles', transaction: 'commerce.transactions' } as const;
export async function requireOwnedResource(pool: Pool, context: AuthorizationContext, kind: keyof typeof resourceTables, id: string, readOnly = false): Promise<void> {
  if (isAuthority(context) || (readOnly && context.user.roles.includes('analyst'))) return;
  const result = await pool.query(`select operator_id from ${resourceTables[kind]} where id=$1`, [id]);
  if (!result.rows[0]?.operator_id) forbidden('Resource access denied');
  await requireOwnedOperator(pool, context, result.rows[0].operator_id, readOnly);
}

export async function requireOperatorFilter(pool: Pool, context: AuthorizationContext, operatorId?: string): Promise<void> {
  if (canReadNational(context)) return;
  if (!operatorId) forbidden('A permitted operatorId is required');
  await requireOwnedOperator(pool, context, operatorId, true);
}

function forbidden(message: string): never {
  throw Object.assign(new Error(message), { code: 'FORBIDDEN' });
}
