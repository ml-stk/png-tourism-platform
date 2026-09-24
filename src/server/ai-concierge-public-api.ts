import { Pool } from 'pg';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { AiConciergeService } from '../services/ai-concierge-service';
import { PostgresAiAuditRepository, PostgresContentRepository, PostgresDestinationRepository, PostgresOperatorRepository } from '../persistence/postgres-repositories';
import { applySecurityHeaders, enforceRateLimit, requestBodyLimit } from './security';
import type { AiConversationRequest } from '../domain/ai';

const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 8000, query_timeout: 15000, statement_timeout: 15000 });
const repositories = {
  destinations: new PostgresDestinationRepository(pool),
  content: new PostgresContentRepository(pool),
  operators: new PostgresOperatorRepository(pool),
  aiAudit: new PostgresAiAuditRepository(pool),
};
const service = new AiConciergeService({
  destinations: repositories.destinations,
  content: repositories.content,
  operators: repositories.operators,
  audit: repositories.aiAudit,
});

export async function handleAiConciergePublicApi(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = new URL(req.url || '/', 'http://localhost');
  if (url.pathname !== '/api/v1/ai/concierge') return false;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  applySecurityHeaders(res);
  if (!enforceRateLimit(req, res)) return true;
  try {
    if (req.method !== 'POST') return send(res, 405, { error: { code: 'METHOD_NOT_ALLOWED', message: 'POST required' } });
    requestBodyLimit(req);
    const body = await readJson(req);
    if (typeof body.message !== 'string') return send(res, 400, { error: { code: 'VALIDATION_ERROR', message: 'message is required' } });
    if (body.message.length > 4000) return send(res, 400, { error: { code: 'VALIDATION_ERROR', message: 'message exceeds maximum length' } });
    const provinceCode = body.provinceCode === undefined ? undefined : body.provinceCode;
    const data = await service.answer({
      message: body.message,
      sessionId: typeof body.sessionId === 'string' ? body.sessionId : undefined,
      ...(provinceCode ? { provinceCode } : {}),
    } satisfies AiConversationRequest);
    return send(res, 200, { data });
  } catch (error: any) {
    const status = error?.code === 'VALIDATION_ERROR' ? 400 : error?.code === 'NOT_FOUND' ? 404 : 500;
    return send(res, status, { error: { code: error?.code || 'INTERNAL_ERROR', message: status === 500 ? 'Internal server error' : error.message } });
  }
}

async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  if (!chunks.length) return {};
  const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw Object.assign(new Error('JSON object required'), { code: 'VALIDATION_ERROR' });
  return parsed as Record<string, unknown>;
}

function send(res: ServerResponse, status: number, body: unknown): boolean {
  res.statusCode = status;
  res.end(JSON.stringify(body));
  return true;
}
