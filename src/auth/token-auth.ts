import { createHmac, timingSafeEqual } from 'node:crypto';
import type { AuthenticatedUser, RoleCode } from './types';
import type { ProvinceCode, ID } from '../domain/types';

interface JwtClaims {
  sub?: string;
  exp?: number;
  iat?: number;
  email?: string;
  name?: string;
  roles?: unknown;
  provinceCodes?: unknown;
  operatorIds?: unknown;
}

const ROLE_CODES: RoleCode[] = ['platform_admin', 'tpa_regulator', 'content_manager', 'provincial_admin', 'operator', 'analyst'];

function decodePart(value: string): unknown {
  return JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
}

function sign(input: string, secret: string): Buffer {
  return createHmac('sha256', secret).update(input).digest();
}

function fail(message: string): never {
  const error: Error & { code?: string } = new Error(message);
  error.code = 'UNAUTHORIZED';
  throw error;
}

export function authenticateBearerToken(authorization: string | undefined, secret: string): AuthenticatedUser {
  if (!authorization || !/^Bearer\s+\S+$/i.test(authorization)) fail('Authentication required');
  if (!secret) fail('Authentication provider is not configured');

  const token = authorization.replace(/^Bearer\s+/i, '').trim();
  const parts = token.split('.');
  if (parts.length !== 3) fail('Invalid bearer token');

  let header: Record<string, unknown>;
  let claims: JwtClaims;
  try {
    header = decodePart(parts[0]) as Record<string, unknown>;
    claims = decodePart(parts[1]) as JwtClaims;
  } catch {
    fail('Invalid bearer token');
  }

  if (header.alg !== 'HS256' || header.typ !== 'JWT') fail('Unsupported bearer token');
  const expected = sign(`${parts[0]}.${parts[1]}`, secret);
  const provided = Buffer.from(parts[2], 'base64url');
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) fail('Invalid bearer token');
  if (typeof claims.sub !== 'string' || !claims.sub) fail('Token subject is required');
  if (claims.exp !== undefined && (typeof claims.exp !== 'number' || claims.exp <= Math.floor(Date.now() / 1000))) fail('Bearer token expired');

  const roles = Array.isArray(claims.roles) ? claims.roles.filter((role): role is RoleCode => typeof role === 'string' && ROLE_CODES.includes(role as RoleCode)) : [];
  const provinceCodes = Array.isArray(claims.provinceCodes) ? claims.provinceCodes.filter((code): code is ProvinceCode => typeof code === 'string') : undefined;
  const operatorIds = Array.isArray(claims.operatorIds) ? claims.operatorIds.filter((id): id is ID => typeof id === 'string') : undefined;

  return {
    id: claims.sub as ID,
    externalSubject: claims.sub,
    email: typeof claims.email === 'string' ? claims.email : '',
    displayName: typeof claims.name === 'string' ? claims.name : claims.sub,
    roles,
    provinceCodes,
    operatorIds,
  };
}
