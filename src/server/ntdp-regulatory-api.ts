import type { IncomingMessage, ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { requirePermission } from '../auth/authorization';
import { authenticate } from './api';
import { NtdpCoreService } from '../services/ntdp-core-service';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const service = new NtdpCoreService(pool);
const base = '/api/v1/ntdp/regulatory';

export async function handleNtdpRegulatoryApi(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = new URL(req.url || '/', 'http://localhost');
  if (!url.pathname.startsWith(`${base}/`)) return false;
  const requestId = req.headers['x-request-id']?.toString() || randomUUID();
  try {
    const context = await authenticate(req, requestId);
    if (req.method === 'GET' && url.pathname === `${base}/licenses`) {
      requirePermission(context, 'operator:read');
      return send(res, 200, { data: await service.listLicenses(url.searchParams.get('operatorId') || undefined), requestId });
    }
    if (req.method === 'POST' && url.pathname === `${base}/licenses`) {
      requirePermission(context, 'operator:register'); const b = await readJson(req);
      if (typeof b.operatorId !== 'string') return validation(res, requestId, 'operatorId is required');
      return send(res, 201, { data: await service.applyLicense({ operatorId: b.operatorId, licenseType: typeof b.licenseType === 'string' ? b.licenseType : undefined, documents: Array.isArray(b.documents) ? b.documents : [], conditions: isRecord(b.conditions) ? b.conditions : {} }), requestId });
    }
    if (req.method === 'PATCH' && url.pathname.startsWith(`${base}/licenses/`)) {
      requirePermission(context, 'operator:approve'); const id = url.pathname.split('/').pop()!; const b = await readJson(req);
      const allowed = ['under_review','approved','suspended','expired','revoked'];
      if (typeof b.status !== 'string' || !allowed.includes(b.status)) return validation(res, requestId, 'status must be under_review, approved, suspended, expired or revoked');
      const data = await service.reviewLicense({ licenseId: id, status: b.status as any, reviewedBy: context.user.id, licenseNumber: typeof b.licenseNumber === 'string' ? b.licenseNumber : undefined, expiresAt: typeof b.expiresAt === 'string' ? b.expiresAt : undefined, notes: typeof b.notes === 'string' ? b.notes : undefined, reason: typeof b.reason === 'string' ? b.reason : undefined });
      return data ? send(res, 200, { data, requestId }) : send(res, 404, { error: { code: 'NOT_FOUND', message: 'License not found' }, requestId });
    }
    if (req.method === 'GET' && url.pathname === `${base}/inspections`) {
      requirePermission(context, 'operator:manage_compliance'); return send(res, 200, { data: await service.listInspections(url.searchParams.get('operatorId') || undefined, url.searchParams.get('licenseId') || undefined), requestId });
    }
    if (req.method === 'POST' && url.pathname === `${base}/inspections`) {
      requirePermission(context, 'operator:manage_compliance'); const b = await readJson(req);
      if (typeof b.licenseId !== 'string' || typeof b.operatorId !== 'string') return validation(res, requestId, 'licenseId and operatorId are required');
      return send(res, 201, { data: await service.createInspection({ licenseId: b.licenseId, operatorId: b.operatorId, inspectorId: context.user.id, inspectionDate: typeof b.inspectionDate === 'string' ? b.inspectionDate : undefined, outcome: typeof b.outcome === 'string' ? b.outcome : undefined, findings: isRecord(b.findings) ? b.findings : {}, recommendations: Array.isArray(b.recommendations) ? b.recommendations : [], nextDueDate: typeof b.nextDueDate === 'string' ? b.nextDueDate : undefined }), requestId });
    }
    if (req.method === 'PATCH' && url.pathname.startsWith(`${base}/inspections/`)) {
      requirePermission(context, 'operator:manage_compliance'); const id = url.pathname.split('/').pop()!; const b = await readJson(req);
      if (b.outcome !== undefined && !['pending','passed','conditional','failed'].includes(String(b.outcome))) return validation(res, requestId, 'outcome must be pending, passed, conditional or failed');
      const data = await service.updateInspection({ inspectionId: id, inspectorId: context.user.id, outcome: b.outcome as any, findings: isRecord(b.findings) ? b.findings : undefined, recommendations: Array.isArray(b.recommendations) ? b.recommendations : undefined, nextDueDate: typeof b.nextDueDate === 'string' ? b.nextDueDate : undefined, reason: typeof b.reason === 'string' ? b.reason : undefined });
      return data ? send(res, 200, { data, requestId }) : send(res, 404, { error: { code: 'NOT_FOUND', message: 'Inspection not found' }, requestId });
    }
    if (req.method === 'GET' && url.pathname === `${base}/compliance-actions`) {
      requirePermission(context, 'operator:manage_compliance'); return send(res, 200, { data: await service.listComplianceActions(url.searchParams.get('operatorId') || undefined, url.searchParams.get('status') || undefined), requestId });
    }
    if (req.method === 'POST' && url.pathname === `${base}/compliance-actions`) {
      requirePermission(context, 'operator:manage_compliance'); const b = await readJson(req);
      if (typeof b.operatorId !== 'string' || typeof b.actionType !== 'string') return validation(res, requestId, 'operatorId and actionType are required');
      return send(res, 201, { data: await service.createComplianceAction({ operatorId: b.operatorId, licenseId: typeof b.licenseId === 'string' ? b.licenseId : undefined, inspectionId: typeof b.inspectionId === 'string' ? b.inspectionId : undefined, actionType: b.actionType, dueAt: typeof b.dueAt === 'string' ? b.dueAt : undefined, notes: typeof b.notes === 'string' ? b.notes : undefined, createdBy: context.user.id }), requestId });
    }
    if (req.method === 'PATCH' && url.pathname.startsWith(`${base}/compliance-actions/`)) {
      requirePermission(context, 'operator:manage_compliance'); const id = url.pathname.split('/').pop()!; const b = await readJson(req);
      if (typeof b.status !== 'string' || !['open','in_progress','completed','cancelled'].includes(b.status)) return validation(res, requestId, 'status must be open, in_progress, completed or cancelled');
      const data = await service.transitionComplianceAction({ actionId: id, status: b.status as any, changedBy: context.user.id, notes: typeof b.notes === 'string' ? b.notes : undefined, reason: typeof b.reason === 'string' ? b.reason : undefined });
      return data ? send(res, 200, { data, requestId }) : send(res, 404, { error: { code: 'NOT_FOUND', message: 'Compliance action not found' }, requestId });
    }
    if (req.method === 'GET' && url.pathname.startsWith(`${base}/history/`)) {
      requirePermission(context, 'audit:read'); const parts = url.pathname.split('/'); const entityType = parts[parts.length - 2]; const entityId = parts[parts.length - 1];
      if (!['license','inspection','compliance_action'].includes(entityType)) return validation(res, requestId, 'entity type must be license, inspection or compliance_action');
      return send(res, 200, { data: await service.regulatoryStatusHistory(entityType as any, entityId), requestId });
    }
    if (req.method === 'POST' && url.pathname === `${base}/maintenance`) {
      requirePermission(context, 'operator:manage_compliance'); return send(res, 200, { data: await service.regulatoryMaintenance(), requestId });
    }
    return send(res, 404, { error: { code: 'NOT_FOUND', message: 'Regulatory route not found' }, requestId });
  } catch (e: any) {
    const status = e?.code === 'UNAUTHORIZED' ? 401 : e?.code === 'FORBIDDEN' ? 403 : e?.code === 'VALIDATION_ERROR' ? 400 : 500;
    return send(res, status, { error: { code: e?.code || 'INTERNAL_ERROR', message: status === 500 ? 'Internal server error' : e.message }, requestId });
  }
}

async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> { const chunks: Buffer[] = []; for await (const chunk of req) chunks.push(Buffer.from(chunk)); try { const value: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8')); if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(); return value as Record<string, unknown>; } catch { throw Object.assign(new Error('Invalid JSON body'), { code: 'VALIDATION_ERROR' }); } }
function isRecord(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === 'object' && !Array.isArray(value); }
function validation(res: ServerResponse, requestId: string, message: string): boolean { return send(res, 400, { error: { code: 'VALIDATION_ERROR', message }, requestId }); }
function send(res: ServerResponse, status: number, body: unknown): boolean { res.statusCode = status; res.setHeader('content-type', 'application/json; charset=utf-8'); res.end(JSON.stringify(body)); return true; }
