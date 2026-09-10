import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { Pool } from 'pg';
import { PostgresOperatorRepository, PostgresDestinationRepository, PostgresContentRepository, PostgresProvinceRepository } from '../persistence/postgres-repositories';
import { PostgresVisitorEngagementRepository } from '../persistence/visitor-engagement-repository';
import { CommandCentreService } from '../services/command-centre-service';
import { requirePermission, requireProvinceAccess } from '../auth/authorization';
import { authenticateBearerToken } from '../auth/token-auth';
import { applySecurityHeaders, enforceRateLimit, requestBodyLimit } from './security';
import type { MetricPeriod } from '../domain/intelligence';
import type { ProvinceCode } from '../domain/types';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const operators = new PostgresOperatorRepository(pool);
const destinations = new PostgresDestinationRepository(pool);
const content = new PostgresContentRepository(pool);
const provinces = new PostgresProvinceRepository(pool);
const engagement = new PostgresVisitorEngagementRepository(pool);
const service = new CommandCentreService({ operators, destinations, content, provinces, engagement });

const periods = new Set<MetricPeriod>(['day', 'week', 'month', 'quarter', 'year']);
const provinceCodes = new Set<ProvinceCode>(['NCD','CENTRAL','GULF','MILNE_BAY','ORO','MOROBE','MADANG','EAST_SEPIK','WEST_SEPIK','MANUS','NEW_IRELAND','EAST_NEW_BRITAIN','WEST_NEW_BRITAIN','BOUGAINVILLE','ENGA','EASTERN_HIGHLANDS','SIMBU','WESTERN_HIGHLANDS','SOUTHERN_HIGHLANDS','JIWAKA','HELA','WESTERN']);

export async function handleCommandCentreApi(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = new URL(req.url || '/', 'http://localhost');
  if (url.pathname !== '/api/v1/command-centre/report' || req.method !== 'GET') return false;
  const requestId = req.headers['x-request-id']?.toString() || randomUUID();
  res.setHeader('x-request-id', requestId); res.setHeader('content-type', 'application/json; charset=utf-8'); applySecurityHeaders(res);
  if (!enforceRateLimit(req, res)) return true;
  try {
    requestBodyLimit(req);
    const context = authenticate(req, requestId);
    requirePermission(context, 'intelligence:read');
    const rawPeriod = url.searchParams.get('period') || 'month';
    if (!periods.has(rawPeriod as MetricPeriod)) throwValidation('Invalid reporting period');
    const rawProvince = url.searchParams.get('province');
    const provinceCode = rawProvince ? parseProvince(rawProvince) : undefined;
    if (provinceCode) requireProvinceAccess(context, provinceCode);
    return send(res, 200, { data: await service.report(rawPeriod as MetricPeriod, provinceCode), requestId });
  } catch (e: any) {
    const status = e?.code === 'UNAUTHORIZED' ? 401 : e?.code === 'FORBIDDEN' ? 403 : e?.code === 'VALIDATION_ERROR' ? 400 : 500;
    return send(res, status, { error: { code: e?.code || 'INTERNAL_ERROR', message: status === 500 ? 'Internal server error' : e.message }, requestId });
  }
}

function parseProvince(value: string): ProvinceCode { if (!provinceCodes.has(value as ProvinceCode)) throwValidation('Invalid province code'); return value as ProvinceCode; }
function authenticate(req: IncomingMessage, requestId: string) {
  if (process.env.NODE_ENV === 'production') return { user: authenticateBearerToken(req.headers.authorization, process.env.AUTH_JWT_SECRET || ''), requestId };
  const subject = req.headers.authorization?.replace(/^Bearer\s+/i, '') || (process.env.DEV_IDENTITY_SUBJECT || 'development');
  const roles = (process.env.DEV_IDENTITY_ROLES || 'platform_admin').split(',').map(r => r.trim()).filter(Boolean);
  return { user: { id: process.env.DEV_IDENTITY_USER_ID || '00000000-0000-0000-0000-000000000001', externalSubject: subject, email: process.env.DEV_IDENTITY_EMAIL || 'developer@pngtourism.local', displayName: 'Development User', roles: roles as any }, requestId };
}
function throwValidation(message: string): never { const e: any = new Error(message); e.code = 'VALIDATION_ERROR'; throw e; }
function send(res: ServerResponse, status: number, body: unknown) { res.statusCode = status; res.end(JSON.stringify(body)); return true; }
