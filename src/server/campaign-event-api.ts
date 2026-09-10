import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { CampaignEventService } from '../services/campaign-event-service';
import { PostgresAuditRepository, PostgresContentRepository } from '../persistence/postgres-repositories';
import { authenticateBearerToken } from '../auth/token-auth';
import { requirePermission, requireProvinceAccess } from '../auth/authorization';
import { applySecurityHeaders, enforceRateLimit, requestBodyLimit } from './security';
import type { ProvinceCode, PublicationStatus } from '../domain/types';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const repository = new PostgresContentRepository(pool);
const service = new CampaignEventService(repository, new PostgresAuditRepository(pool));
const provinces = ['NCD','CENTRAL','GULF','MILNE_BAY','ORO','MOROBE','MADANG','EAST_SEPIK','WEST_SEPIK','MANUS','NEW_IRELAND','EAST_NEW_BRITAIN','WEST_NEW_BRITAIN','BOUGAINVILLE','ENGA','EASTERN_HIGHLANDS','SIMBU','WESTERN_HIGHLANDS','SOUTHERN_HIGHLANDS','JIWAKA','HELA','WESTERN'];

export async function handleCampaignEventApi(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = new URL(req.url || '/', 'http://localhost');
  if (!url.pathname.startsWith('/api/v1/campaigns') && !url.pathname.startsWith('/api/v1/events') && !url.pathname.startsWith('/api/v1/public/events') && !url.pathname.startsWith('/api/v1/public/campaigns')) return false;
  const requestId = req.headers['x-request-id']?.toString() || randomUUID(); res.setHeader('x-request-id', requestId); res.setHeader('content-type', 'application/json; charset=utf-8'); applySecurityHeaders(res);
  try {
    requestBodyLimit(req); if (!enforceRateLimit(req, res)) return true;
    const publicRoute = url.pathname.startsWith('/api/v1/public/');
    if (publicRoute && req.method === 'GET') {
      const type = url.pathname.includes('/events') ? 'event' : 'campaign'; const provinceCode = parseProvince(url.searchParams.get('province'));
      if (provinceCode) { /* public province filter is intentionally non-sensitive */ }
      const data = await service.list({ type, provinceCode, publishedOnly: true }); return send(res, 200, { data, requestId });
    }
    const context = authenticate(req, requestId); requirePermission(context, 'content:write');
    if (req.method === 'POST' && url.pathname === '/api/v1/events') {
      const body = await readJson(req); const provinceCode = parseProvince(body.provinceCode); if (!provinceCode) throwValidation('provinceCode is required'); requireProvinceAccess(context, provinceCode);
      const data = await service.createEvent({ title: requiredString(body.title,'title'), slug: requiredString(body.slug,'slug'), provinceCode, summary: typeof body.summary === 'string' ? body.summary : undefined, startsAt: requiredString(body.startsAt,'startsAt'), endsAt: requiredString(body.endsAt,'endsAt'), venue: typeof body.venue === 'string' ? body.venue : undefined, actorId: context.user.id, requestId }); return send(res, 201, { data, requestId });
    }
    if (req.method === 'POST' && url.pathname === '/api/v1/campaigns') {
      const body = await readJson(req); const provinceCode = body.provinceCode === undefined ? undefined : parseProvince(body.provinceCode); if (provinceCode) requireProvinceAccess(context, provinceCode);
      const ids = Array.isArray(body.linkedContentIds) ? body.linkedContentIds.filter((v): v is string => typeof v === 'string') : []; const data = await service.createCampaign({ title: requiredString(body.title,'title'), slug: requiredString(body.slug,'slug'), provinceCode, summary: typeof body.summary === 'string' ? body.summary : undefined, linkedContentIds: ids, actorId: context.user.id, requestId }); return send(res, 201, { data, requestId });
    }
    const match = url.pathname.match(/^\/api\/v1\/(events|campaigns)\/([^/]+)\/(publish|status)$/); if (match) {
      const id = decodeURIComponent(match[2]); const item = await service.get(id); if (item.type !== match[1].slice(0,-1)) throwValidation('Activation type does not match route'); if (item.provinceCode) requireProvinceAccess(context, item.provinceCode);
      if (match[3] === 'publish') return send(res, 200, { data: await service.publish(id, context.user.id, requestId), requestId });
      const body = await readJson(req); const status = body.status as PublicationStatus; if (!['draft','review','published','archived'].includes(status)) throwValidation('Invalid publication status'); return send(res, 200, { data: await service.setStatus(id, status, context.user.id, requestId), requestId });
    }
    if (req.method === 'GET' && (url.pathname === '/api/v1/events' || url.pathname === '/api/v1/campaigns')) { requirePermission(context, 'content:read'); const type = url.pathname.endsWith('/events') ? 'event' : 'campaign'; const provinceCode = parseProvince(url.searchParams.get('province')); if (provinceCode) requireProvinceAccess(context, provinceCode); return send(res, 200, { data: await service.list({ type, provinceCode }), requestId }); }
    return send(res, 404, { error: { code: 'NOT_FOUND', message: 'Activation route not found' }, requestId });
  } catch (e: any) { const status = e?.code === 'UNAUTHORIZED' ? 401 : e?.code === 'FORBIDDEN' ? 403 : e?.code === 'NOT_FOUND' ? 404 : e?.code === 'VALIDATION_ERROR' ? 400 : e?.code === 'CONFLICT' ? 409 : 500; return send(res, status, { error: { code: e?.code || 'INTERNAL_ERROR', message: status === 500 ? 'Internal server error' : e.message }, requestId }); }
}
function parseProvince(value: unknown): ProvinceCode | undefined { if (value === undefined || value === null || value === '') return undefined; if (typeof value !== 'string' || !provinces.includes(value)) throwValidation('Invalid province code'); return value as ProvinceCode; }
function authenticate(req: IncomingMessage, requestId: string) { if (process.env.NODE_ENV === 'production') return { user: authenticateBearerToken(req.headers.authorization, process.env.AUTH_JWT_SECRET || ''), requestId }; const subject = req.headers.authorization?.replace(/^Bearer\s+/i, '') || (process.env.DEV_IDENTITY_SUBJECT || 'development'); const roles = (process.env.DEV_IDENTITY_ROLES || 'platform_admin').split(',').map(r => r.trim()).filter(Boolean); return { user: { id: process.env.DEV_IDENTITY_USER_ID || '00000000-0000-0000-0000-000000000001', externalSubject: subject, email: process.env.DEV_IDENTITY_EMAIL || 'developer@pngtourism.local', displayName: 'Development User', roles: roles as any }, requestId }; }
function requiredString(v: unknown, field: string): string { if (typeof v !== 'string' || !v.trim()) throwValidation(`${field} is required`); return v.trim(); }
async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> { const chunks: Buffer[] = []; for await (const c of req) chunks.push(Buffer.from(c)); try { const p: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8')); if (!p || typeof p !== 'object' || Array.isArray(p)) throw new Error(); return p as Record<string, unknown>; } catch { throwValidation('Invalid JSON body'); } }
function throwValidation(message: string): never { const e: any = new Error(message); e.code = 'VALIDATION_ERROR'; throw e; }
function send(res: ServerResponse, status: number, body: unknown): true { res.statusCode = status; res.end(JSON.stringify(body)); return true; }
