import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { Pool } from 'pg';
import { PostgresVisitorEngagementRepository } from '../persistence/visitor-engagement-repository';
import { VisitorEngagementService, isVisitorEngagementSource } from '../services/visitor-engagement-service';
import type { VisitorEngagementEventType } from '../domain/visitor-engagement';
import { applySecurityHeaders, enforceRateLimit, requestBodyLimit } from './security';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const service = new VisitorEngagementService(new PostgresVisitorEngagementRepository(pool));
const eventTypes = new Set<VisitorEngagementEventType>([
  'experience_view', 'experience_saved', 'experience_added_to_itinerary',
  'destination_added_to_itinerary', 'qr_handoff_created',
]);

export async function handleVisitorEngagementApi(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = new URL(req.url || '/', 'http://localhost');
  if (url.pathname !== '/api/v1/visitor/engagement' || req.method !== 'POST') return false;
  const requestId = req.headers['x-request-id']?.toString() || randomUUID();
  res.setHeader('x-request-id', requestId);
  res.setHeader('content-type', 'application/json; charset=utf-8');
  applySecurityHeaders(res);
  if (!enforceRateLimit(req, res)) return true;
  try {
    requestBodyLimit(req);
    const body = await readJson(req);
    if (typeof body.eventType !== 'string' || !eventTypes.has(body.eventType as VisitorEngagementEventType)) return send(res, 400, { error: { code: 'VALIDATION_ERROR', message: 'Unsupported eventType' }, requestId });
    if (!isVisitorEngagementSource(body.source)) return send(res, 400, { error: { code: 'VALIDATION_ERROR', message: 'Unsupported source' }, requestId });
    const metadata = typeof body.metadata === 'object' && body.metadata && !Array.isArray(body.metadata) ? Object.fromEntries(Object.entries(body.metadata).filter(([key, value]) => key.length <= 64 && (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')).slice(0, 10)) : {};
    await service.record({ eventType: body.eventType as VisitorEngagementEventType, source: body.source, ...(typeof body.experienceId === 'string' ? { experienceId: body.experienceId } : {}), ...(typeof body.destinationId === 'string' ? { destinationId: body.destinationId } : {}), ...(typeof body.operatorId === 'string' ? { operatorId: body.operatorId } : {}), ...(typeof body.provinceCode === 'string' ? { provinceCode: body.provinceCode } : {}), metadata });
    return send(res, 202, { data: { accepted: true }, requestId });
  } catch {
    return send(res, 400, { error: { code: 'VALIDATION_ERROR', message: 'Invalid engagement event' }, requestId });
  }
}

async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => { raw += chunk; });
    req.on('end', () => { try { const parsed = JSON.parse(raw); if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) reject(new Error('object required')); else resolve(parsed as Record<string, unknown>); } catch { reject(new Error('invalid json')); } });
    req.on('error', reject);
  });
}
function send(res: ServerResponse, status: number, body: unknown) { res.statusCode = status; res.end(JSON.stringify(body)); return true; }
