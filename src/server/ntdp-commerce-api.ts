import { readJson } from './request-body';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { requireAuthority, requireOperatorFilter, requireOwnedResource } from './resource-access';
import { requirePermission } from '../auth/authorization';
import { authenticate } from './api';
import { NtdpCommerceService, type CommerceStatus } from '../services/ntdp-commerce-service';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const service = new NtdpCommerceService(pool);
const statuses: CommerceStatus[] = ['initiated','pending','authorised','settled','failed','refunded','cancelled'];

export async function handleNtdpCommerceApi(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = new URL(req.url || '/', 'http://localhost');
  if (!url.pathname.startsWith('/api/v1/ntdp/commerce/')) return false;
  try {
    const context = await authenticate(req, req.headers['x-request-id']?.toString() || randomUUID());
    if (req.method === 'GET' && url.pathname === '/api/v1/ntdp/commerce/readiness') {
      requirePermission(context, 'commerce:read');
      return send(res, 200, { data: await service.providerReadiness(), requestId: context.requestId });
    }
    if (req.method === 'GET' && url.pathname === '/api/v1/ntdp/commerce/transactions') {
      requirePermission(context, 'commerce:read');
      await requireOperatorFilter(pool, context, url.searchParams.get('operatorId') || undefined);
      const limit = Number(url.searchParams.get('limit') || 50);
      return send(res, 200, { data: await service.listTransactions({ status: url.searchParams.get('status') || undefined, providerCode: url.searchParams.get('provider') || undefined, operatorId: url.searchParams.get('operatorId') || undefined, limit: Number.isFinite(limit) ? limit : 50 }), requestId: context.requestId });
    }
    if (req.method === 'GET' && url.pathname.startsWith('/api/v1/ntdp/commerce/transactions/') && url.pathname.endsWith('/events')) {
      requirePermission(context, 'commerce:read');
      const parts = url.pathname.split('/');
      await requireOwnedResource(pool, context, 'transaction', parts[parts.length - 2], true);
      return send(res, 200, { data: await service.transactionEvents(parts[parts.length - 2]), requestId: context.requestId });
    }
    if (req.method === 'GET' && url.pathname.startsWith('/api/v1/ntdp/commerce/transactions/')) {
      requirePermission(context, 'commerce:read');
      const id = url.pathname.split('/').pop()!;
      await requireOwnedResource(pool, context, 'transaction', id, true);
      const data = await service.getTransaction(id);
      if (!data) return send(res, 404, { error: { code: 'NOT_FOUND', message: 'Transaction not found' }, requestId: context.requestId });
      return send(res, 200, { data, requestId: context.requestId });
    }
    if (req.method === 'PATCH' && url.pathname.startsWith('/api/v1/ntdp/commerce/transactions/')) {
      requirePermission(context, 'commerce:write');
      requireAuthority(context);
      const id = url.pathname.split('/').pop()!;
      const body = await readJson(req);
      if (typeof body.status !== 'string' || !statuses.includes(body.status as CommerceStatus)) return validation(res, context.requestId, 'status must be a valid commerce transaction status');
      const data = await service.transitionTransaction({ transactionId: id, status: body.status as CommerceStatus, changedBy: context.user.id, externalReference: typeof body.externalReference === 'string' ? body.externalReference : undefined, reason: typeof body.reason === 'string' ? body.reason : undefined, metadata: isRecord(body.metadata) ? body.metadata : {} });
      if (!data) return send(res, 404, { error: { code: 'NOT_FOUND', message: 'Transaction not found' }, requestId: context.requestId });
      return send(res, 200, { data, requestId: context.requestId });
    }
    return false;
  } catch (e: any) {
    const status = e?.code === 'UNAUTHORIZED' ? 401 : e?.code === 'FORBIDDEN' ? 403 : e?.code === 'VALIDATION_ERROR' ? 400 : 500;
    return send(res, status, { error: { code: e?.code || 'INTERNAL_ERROR', message: status === 500 ? 'Internal server error' : e.message }, requestId: req.headers['x-request-id']?.toString() || randomUUID() });
  }
}
function isRecord(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === 'object' && !Array.isArray(value); }
function validation(res: ServerResponse, requestId: string, message: string): boolean { return send(res, 400, { error: { code: 'VALIDATION_ERROR', message }, requestId }); }
function send(res: ServerResponse, status: number, body: unknown): boolean { res.statusCode = status; res.setHeader('content-type', 'application/json; charset=utf-8'); res.end(JSON.stringify(body)); return true; }
