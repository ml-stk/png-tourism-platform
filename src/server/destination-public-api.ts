import { Pool } from 'pg';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { DestinationProjectionService } from '../services/destination-projection-service';
import { PostgresDestinationProjectionRepository } from '../persistence/destination-projection-repository';
import { applySecurityHeaders, enforceRateLimit } from './security';
import type { ProvinceCode } from '../domain/types';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const service = new DestinationProjectionService(new PostgresDestinationProjectionRepository(pool));

export async function handleDestinationPublicApi(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = new URL(req.url || '/', 'http://localhost');
  if (!url.pathname.startsWith('/api/v1/public/destinations')) return false;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  applySecurityHeaders(res);
  if (!enforceRateLimit(req, res)) return true;
  try {
    if (req.method !== 'GET') return send(res, 405, { error: { code: 'METHOD_NOT_ALLOWED', message: 'GET required' } });
    const match = url.pathname.match(/^\/api\/v1\/public\/destinations\/([^/]+)$/);
    if (match) return send(res, 200, { data: await service.get(decodeURIComponent(match[1])) });
    const province = url.searchParams.get('province') || undefined;
    return send(res, 200, { data: await service.list(province as ProvinceCode | undefined) });
  } catch (e: any) {
    const status = e?.code === 'NOT_FOUND' ? 404 : 500;
    return send(res, status, { error: { code: e?.code || 'INTERNAL_ERROR', message: status === 500 ? 'Internal server error' : e.message } });
  }
}
function send(res: ServerResponse, status: number, body: unknown) { res.statusCode = status; res.end(JSON.stringify(body)); return true; }
