import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { Pool } from 'pg';
import { OperatorService } from '../services/operator-service';
import { PostgresAuditRepository, PostgresOperatorRepository } from '../persistence/postgres-repositories';
import { applySecurityHeaders, enforceRateLimit, requestBodyLimit } from './security';
import type { ProvinceCode } from '../domain/types';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const operators = new PostgresOperatorRepository(pool);
const audit = new PostgresAuditRepository(pool);
const service = new OperatorService(operators, audit);

const PROVINCES: ProvinceCode[] = ['NCD','CENTRAL','GULF','MILNE_BAY','ORO','MOROBE','MADANG','EAST_SEPIK','WEST_SEPIK','MANUS','NEW_IRELAND','EAST_NEW_BRITAIN','WEST_NEW_BRITAIN','BOUGAINVILLE','ENGA','EASTERN_HIGHLANDS','SIMBU','WESTERN_HIGHLANDS','SOUTHERN_HIGHLANDS','JIWAKA','HELA','WESTERN'];

export async function handleOperatorRegistrationApi(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = new URL(req.url || '/', 'http://localhost');
  if (req.method !== 'POST' || url.pathname !== '/api/v1/public/operator-registration') return false;
  const requestId = req.headers['x-request-id']?.toString() || randomUUID();
  res.setHeader('x-request-id', requestId);
  res.setHeader('content-type', 'application/json; charset=utf-8');
  applySecurityHeaders(res);
  if (!enforceRateLimit(req, res)) return true;
  try {
    requestBodyLimit(req);
    const body = await readJson(req);
    const legalName = requiredString(body.legalName, 'legalName');
    const tradingName = typeof body.tradingName === 'string' ? body.tradingName.trim() : undefined;
    const provinceCode = body.provinceCode;
    if (typeof provinceCode !== 'string' || !PROVINCES.includes(provinceCode as ProvinceCode)) throwValidation('Valid provinceCode is required');
    const operator = await service.register({ legalName, ...(tradingName ? { tradingName } : {}), provinceCode: provinceCode as ProvinceCode, requestId });
    return send(res, 201, { data: { id: operator.id, status: operator.status, complianceStatus: operator.complianceStatus, provinceCode: operator.provinceCode }, requestId });
  } catch (e: any) {
    const status = e?.code === 'VALIDATION_ERROR' ? 400 : e?.code === 'CONFLICT' ? 409 : 500;
    return send(res, status, { error: { code: e?.code || 'INTERNAL_ERROR', message: status === 500 ? 'Registration service unavailable' : e.message }, requestId });
  }
}

function requiredString(value: unknown, field: string): string { if (typeof value !== 'string' || !value.trim()) throwValidation(`${field} is required`); return value.trim(); }
async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> { const chunks: Buffer[] = []; let size = 0; const maxBytes = Number(process.env.REQUEST_BODY_MAX_BYTES || 1_048_576); for await (const c of req) { const chunk = Buffer.from(c); size += chunk.length; if (size > maxBytes) throwValidation('Request body exceeds maximum size'); chunks.push(chunk); } try { const parsed: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8')); if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error(); return parsed as Record<string, unknown>; } catch { throwValidation('Invalid JSON body'); } }
function throwValidation(message: string): never { const error: Error & { code?: string } = new Error(message); error.code = 'VALIDATION_ERROR'; throw error; }
function send(res: ServerResponse, status: number, body: unknown): true { res.statusCode = status; res.end(JSON.stringify(body)); return true; }
