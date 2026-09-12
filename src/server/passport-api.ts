import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { Pool } from 'pg';
import { PostgresContentRepository, PostgresDestinationRepository, PostgresOperatorRepository } from '../persistence/postgres-repositories';
import { PostgresVisitorEngagementRepository } from '../persistence/visitor-engagement-repository';
import { PublicVisitorService } from '../services/public-visitor-service';
import { OfflineService } from '../services/offline-service';
import { VisitorEngagementService } from '../services/visitor-engagement-service';
import { applySecurityHeaders, enforceRateLimit, requestBodyLimit } from './security';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const repositories = {
  destinations: new PostgresDestinationRepository(pool),
  content: new PostgresContentRepository(pool),
  operators: new PostgresOperatorRepository(pool),
};
const publicVisitorService = new PublicVisitorService(repositories);
const offlineService = new OfflineService(repositories);
const engagementService = new VisitorEngagementService(new PostgresVisitorEngagementRepository(pool));

export async function handlePassportApi(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = new URL(req.url || '/', 'http://localhost');
  if (url.pathname !== '/api/v1/public/passport/verify' || req.method !== 'POST') return false;
  const requestId = req.headers['x-request-id']?.toString() || randomUUID();
  res.setHeader('x-request-id', requestId);
  res.setHeader('content-type', 'application/json; charset=utf-8');
  applySecurityHeaders(res);
  if (!enforceRateLimit(req, res)) return true;
  try {
    requestBodyLimit(req);
    const body = await readJson(req);
    if (typeof body.verificationToken !== 'string' || !body.verificationToken.trim()) return send(res, 400, { error: { code: 'VALIDATION_ERROR', message: 'verificationToken is required' }, requestId });
    const verified = offlineService.verifyQrHandoff(body.verificationToken.trim());
    if (verified.targetType !== 'destination') return send(res, 400, { error: { code: 'VALIDATION_ERROR', message: 'Only destination QR codes can verify a passport visit' }, requestId });
    const destination = await publicVisitorService.destination(verified.targetId);
    await engagementService.record({
      eventType: 'destination_visit_verified',
      source: 'qr',
      destinationId: destination.id,
      provinceCode: destination.provinceCode,
      metadata: { method: 'signed_qr', verificationVersion: 1 },
    });
    return send(res, 200, { data: { verified: true, destination: { id: destination.id, name: destination.name, provinceCode: destination.provinceCode }, verifiedAt: new Date().toISOString(), expiresAt: verified.expiresAt }, requestId });
  } catch (error: any) {
    const message = error?.message === 'QR verification token expired' ? error.message : 'Invalid or unverifiable QR verification token';
    return send(res, 400, { error: { code: 'VERIFICATION_FAILED', message }, requestId });
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
