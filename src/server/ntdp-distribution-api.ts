import type { IncomingMessage, ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { requirePermission } from '../auth/authorization';
import { authenticate } from './api';
import { NtdpDistributionLifecycleService } from '../services/ntdp-distribution-lifecycle';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const service = new NtdpDistributionLifecycleService(pool);

export async function handleNtdpDistributionApi(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = new URL(req.url || '/', 'http://localhost');
  if (!url.pathname.startsWith('/api/v1/ntdp/distribution/')) return false;
  try {
    const context = await authenticate(req, req.headers['x-request-id']?.toString() || randomUUID());
    if (req.method === 'GET' && url.pathname === '/api/v1/ntdp/distribution/publications') {
      requirePermission(context, 'distribution:read');
      return send(res, 200, { data: await service.listPublications(url.searchParams.get('channel') || undefined, url.searchParams.get('status') || undefined), requestId: context.requestId });
    }
    if (req.method === 'PATCH' && url.pathname.startsWith('/api/v1/ntdp/distribution/publications/')) {
      requirePermission(context, 'distribution:write');
      const id = url.pathname.split('/').pop()!;
      const body = await readJson(req);
      if (!['published','failed','cancelled'].includes(String(body.status))) return validation(res, context.requestId, 'status must be published, failed or cancelled');
      const data = await service.transitionPublication({ publicationId: id, status: body.status as 'published'|'failed'|'cancelled', changedBy: context.user.id, message: typeof body.message === 'string' ? body.message : undefined });
      if (!data) return send(res, 404, { error: { code: 'NOT_FOUND', message: 'Publication not found or transition not permitted' }, requestId: context.requestId });
      return send(res, 200, { data, requestId: context.requestId });
    }
    if (req.method === 'GET' && url.pathname.startsWith('/api/v1/ntdp/distribution/publications/') && url.pathname.endsWith('/events')) {
      requirePermission(context, 'distribution:read');
      const parts = url.pathname.split('/');
      return send(res, 200, { data: await service.publicationEvents(parts[parts.length - 2]), requestId: context.requestId });
    }
    if (req.method === 'PATCH' && url.pathname.startsWith('/api/v1/ntdp/distribution/partners/')) {
      requirePermission(context, 'distribution:write');
      const id = url.pathname.split('/').pop()!;
      const body = await readJson(req);
      if (!['pending','approved','suspended','revoked'].includes(String(body.status))) return validation(res, context.requestId, 'status must be pending, approved, suspended or revoked');
      const data = await service.transitionPartner({ partnerId: id, status: body.status as 'pending'|'approved'|'suspended'|'revoked', changedBy: context.user.id, reason: typeof body.reason === 'string' ? body.reason : undefined });
      if (!data) return send(res, 404, { error: { code: 'NOT_FOUND', message: 'Partner not found' }, requestId: context.requestId });
      return send(res, 200, { data, requestId: context.requestId });
    }
    if (req.method === 'GET' && url.pathname.startsWith('/api/v1/ntdp/distribution/partners/') && url.pathname.endsWith('/events')) {
      requirePermission(context, 'distribution:read');
      const parts = url.pathname.split('/');
      return send(res, 200, { data: await service.partnerEvents(parts[parts.length - 2]), requestId: context.requestId });
    }
    return send(res, 404, { error: { code: 'NOT_FOUND', message: 'Distribution lifecycle route not found' }, requestId: context.requestId });
  } catch (e: any) {
    const status = e?.code === 'UNAUTHORIZED' ? 401 : e?.code === 'FORBIDDEN' ? 403 : e?.code === 'VALIDATION_ERROR' ? 400 : 500;
    return send(res, status, { error: { code: e?.code || 'INTERNAL_ERROR', message: status === 500 ? 'Internal server error' : e.message }, requestId: req.headers['x-request-id']?.toString() || randomUUID() });
  }
}
async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> { const chunks: Buffer[] = []; for await (const chunk of req) chunks.push(Buffer.from(chunk)); try { const value: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8')); if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(); return value as Record<string, unknown>; } catch { const e: any = new Error('Invalid JSON body'); e.code = 'VALIDATION_ERROR'; throw e; } }
function validation(res: ServerResponse, requestId: string, message: string): boolean { return send(res, 400, { error: { code: 'VALIDATION_ERROR', message }, requestId }); }
function send(res: ServerResponse, status: number, body: unknown): boolean { res.statusCode = status; res.setHeader('content-type', 'application/json; charset=utf-8'); res.end(JSON.stringify(body)); return true; }
