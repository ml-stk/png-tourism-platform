import type { IncomingMessage, ServerResponse } from 'node:http';
import { Pool } from 'pg';
import { requirePermission, requireProvinceAccess } from '../auth/authorization';
import { authenticate } from './api';
import { NtdpCoreService } from '../services/ntdp-core-service';
import type { ProvinceCode } from '../domain/types';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const service = new NtdpCoreService(pool);

export async function handleNtdpEnterpriseApi(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = new URL(req.url || '/', 'http://localhost');
  if (!url.pathname.startsWith('/api/v1/ntdp/')) return false;
  try {
    const context = await authenticate(req, req.headers['x-request-id']?.toString() || cryptoRandomId());
    if (req.method === 'GET' && url.pathname === '/api/v1/ntdp/warehouse/operator-snapshot') {
      requirePermission(context, 'warehouse:read');
      return send(res, 200, { data: await service.snapshotOperators(), requestId: context.requestId });
    }
    if (req.method === 'POST' && url.pathname === '/api/v1/ntdp/warehouse/operator-snapshot') {
      requirePermission(context, 'warehouse:write');
      const body = await readJson(req);
      return send(res, 200, { data: await service.snapshotOperators(typeof body.snapshotDate === 'string' ? body.snapshotDate : undefined), requestId: context.requestId });
    }
    if (req.method === 'GET' && url.pathname === '/api/v1/ntdp/gis/assets') {
      requirePermission(context, 'gis:read');
      const province = parseProvince(url.searchParams.get('province'));
      if (province) requireProvinceAccess(context, province);
      return send(res, 200, { data: await service.geoAssets(province), requestId: context.requestId });
    }
    if (req.method === 'POST' && url.pathname === '/api/v1/ntdp/gis/assets') {
      requirePermission(context, 'gis:write');
      const body = await readJson(req);
      const province = parseProvince(body.provinceCode);
      if (province) requireProvinceAccess(context, province);
      if (typeof body.assetType !== 'string' || typeof body.sourceId !== 'string' || typeof body.name !== 'string' || typeof body.latitude !== 'number' || typeof body.longitude !== 'number') return validation(res, context.requestId, 'assetType, sourceId, name, latitude and longitude are required');
      return send(res, 201, { data: await service.upsertGeoAsset({ assetType: body.assetType, sourceId: body.sourceId, name: body.name, provinceCode: province, latitude: body.latitude, longitude: body.longitude, properties: isRecord(body.properties) ? body.properties : {}, isPublic: body.isPublic === true }), requestId: context.requestId });
    }
    if (req.method === 'GET' && url.pathname.startsWith('/api/v1/ntdp/sme/')) {
      requirePermission(context, 'sme:read');
      return send(res, 200, { data: await service.getSmeProfile(url.pathname.split('/').pop()!), requestId: context.requestId });
    }
    if (req.method === 'POST' && url.pathname === '/api/v1/ntdp/sme/profiles') {
      requirePermission(context, 'sme:write');
      const body = await readJson(req);
      if (typeof body.operatorId !== 'string') return validation(res, context.requestId, 'operatorId is required');
      return send(res, 201, { data: await service.createSmeProfile({ operatorId: body.operatorId, businessSize: typeof body.businessSize === 'string' ? body.businessSize : undefined, ownershipType: typeof body.ownershipType === 'string' ? body.ownershipType : undefined, needs: Array.isArray(body.needs) ? body.needs : [] }), requestId: context.requestId });
    }
    if (req.method === 'POST' && url.pathname === '/api/v1/ntdp/sme/assessments') {
      requirePermission(context, 'sme:write');
      const body = await readJson(req);
      if (typeof body.smeId !== 'string') return validation(res, context.requestId, 'smeId is required');
      return send(res, 201, { data: await service.assessSme({ smeId: body.smeId, assessorId: context.user.id, score: typeof body.score === 'number' ? body.score : undefined, findings: isRecord(body.findings) ? body.findings : {}, recommendedActions: Array.isArray(body.recommendedActions) ? body.recommendedActions : [], status: body.status === 'final' ? 'final' : 'draft' }), requestId: context.requestId });
    }
    if (req.method === 'GET' && url.pathname === '/api/v1/ntdp/membership') {
      requirePermission(context, 'membership:read');
      return send(res, 200, { data: await service.listMemberships(url.searchParams.get('operatorId') || undefined), requestId: context.requestId });
    }
    if (req.method === 'POST' && url.pathname === '/api/v1/ntdp/membership') {
      requirePermission(context, 'membership:write');
      const body = await readJson(req);
      if (typeof body.operatorId !== 'string') return validation(res, context.requestId, 'operatorId is required');
      return send(res, 201, { data: await service.applyMembership({ operatorId: body.operatorId, feeAmount: typeof body.feeAmount === 'number' ? body.feeAmount : undefined, expiresAt: typeof body.expiresAt === 'string' ? body.expiresAt : undefined, renewalOf: typeof body.renewalOf === 'string' ? body.renewalOf : undefined, notes: typeof body.notes === 'string' ? body.notes : undefined }), requestId: context.requestId });
    }
    if (req.method === 'GET' && url.pathname === '/api/v1/ntdp/distribution') {
      requirePermission(context, 'distribution:read');
      return send(res, 200, { data: await service.distributionQueue(url.searchParams.get('channel') || undefined), requestId: context.requestId });
    }
    if (req.method === 'POST' && url.pathname === '/api/v1/ntdp/distribution') {
      requirePermission(context, 'distribution:write');
      const body = await readJson(req);
      if (typeof body.channelCode !== 'string' || (typeof body.contentId !== 'string' && typeof body.destinationId !== 'string')) return validation(res, context.requestId, 'channelCode and a contentId or destinationId are required');
      const data = await service.queueDistribution({ channelCode: body.channelCode, contentId: typeof body.contentId === 'string' ? body.contentId : undefined, destinationId: typeof body.destinationId === 'string' ? body.destinationId : undefined });
      if (!data) return send(res, 404, { error: { code: 'NOT_FOUND', message: 'Active distribution channel not found' }, requestId: context.requestId });
      return send(res, 201, { data, requestId: context.requestId });
    }
    if (req.method === 'GET' && url.pathname === '/api/v1/ntdp/commerce/readiness') {
      requirePermission(context, 'commerce:read');
      return send(res, 200, { data: await service.commerceReadiness(), requestId: context.requestId });
    }
    if (req.method === 'POST' && url.pathname === '/api/v1/ntdp/commerce/transactions') {
      requirePermission(context, 'commerce:write');
      const body = await readJson(req);
      if (typeof body.transactionType !== 'string' || typeof body.amount !== 'number') return validation(res, context.requestId, 'transactionType and amount are required');
      const data = await service.createTransaction({ transactionType: body.transactionType, amount: body.amount, currency: typeof body.currency === 'string' ? body.currency : undefined, operatorId: typeof body.operatorId === 'string' ? body.operatorId : undefined, providerCode: typeof body.providerCode === 'string' ? body.providerCode : undefined, idempotencyKey: typeof body.idempotencyKey === 'string' ? body.idempotencyKey : undefined, metadata: isRecord(body.metadata) ? body.metadata : {} });
      if (!data) return send(res, 404, { error: { code: 'NOT_FOUND', message: 'Payment provider not found' }, requestId: context.requestId });
      return send(res, 201, { data, requestId: context.requestId });
    }
    return send(res, 404, { error: { code: 'NOT_FOUND', message: 'NTDP enterprise route not found' }, requestId: context.requestId });
  } catch (e: any) {
    const status = e?.code === 'UNAUTHORIZED' ? 401 : e?.code === 'FORBIDDEN' ? 403 : e?.code === 'VALIDATION_ERROR' ? 400 : 500;
    return send(res, status, { error: { code: e?.code || 'INTERNAL_ERROR', message: status === 500 ? 'Internal server error' : e.message }, requestId: req.headers['x-request-id']?.toString() || cryptoRandomId() });
  }
}

function parseProvince(value: unknown): ProvinceCode | undefined { if (value === undefined || value === null || value === '') return undefined; if (typeof value !== 'string' || !['NCD','CENTRAL','GULF','MILNE_BAY','ORO','MOROBE','MADANG','EAST_SEPIK','WEST_SEPIK','MANUS','NEW_IRELAND','EAST_NEW_BRITAIN','WEST_NEW_BRITAIN','BOUGAINVILLE','ENGA','EASTERN_HIGHLANDS','SIMBU','WESTERN_HIGHLANDS','SOUTHERN_HIGHLANDS','JIWAKA','HELA','WESTERN'].includes(value)) { const e: any = new Error('Invalid province code'); e.code = 'VALIDATION_ERROR'; throw e; } return value as ProvinceCode; }
async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> { const chunks: Buffer[] = []; for await (const chunk of req) chunks.push(Buffer.from(chunk)); try { const value: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8')); if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(); return value as Record<string, unknown>; } catch { const e: any = new Error('Invalid JSON body'); e.code = 'VALIDATION_ERROR'; throw e; } }
function isRecord(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === 'object' && !Array.isArray(value); }
function validation(res: ServerResponse, requestId: string, message: string): boolean { return send(res, 400, { error: { code: 'VALIDATION_ERROR', message }, requestId }); }
function send(res: ServerResponse, status: number, body: unknown): boolean { res.statusCode = status; res.setHeader('content-type','application/json; charset=utf-8'); res.end(JSON.stringify(body)); return true; }
function cryptoRandomId(){return Math.random().toString(36).slice(2)+Date.now().toString(36);}
