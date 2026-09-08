import { randomUUID } from 'node:crypto';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { Pool } from 'pg';
import { OperatorService } from '../services/operator-service';
import { requirePermission, requireProvinceAccess, requireOperatorAccess } from '../auth/authorization';
import type { AuthorizationContext, AuthenticatedUser } from '../auth/types';
import type { ComplianceStatus, ProvinceCode } from '../domain/types';
import { PostgresAuditRepository, PostgresOperatorRepository, PostgresProvinceRepository } from '../persistence/postgres-repositories';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const repositories = { operators: new PostgresOperatorRepository(pool), provinces: new PostgresProvinceRepository(pool), audit: new PostgresAuditRepository(pool) };
const operatorService = new OperatorService(repositories.operators, repositories.audit);

export function createApiServer() {
  return createServer(async (req, res) => {
    const requestId = req.headers['x-request-id']?.toString() || randomUUID();
    res.setHeader('x-request-id', requestId);
    res.setHeader('content-type', 'application/json; charset=utf-8');
    try {
      const context = authenticate(req, requestId);
      const url = new URL(req.url || '/', 'http://localhost');
      if (req.method === 'GET' && url.pathname === '/api/v1/operators') {
        requirePermission(context, 'operator:read');
        const provinceCode = url.searchParams.get('province') || undefined;
        if (provinceCode) requireProvinceAccess(context, provinceCode as ProvinceCode);
        return send(res, 200, { data: await repositories.operators.list({ provinceCode, status: url.searchParams.get('status') || undefined, cursor: url.searchParams.get('cursor') || undefined }), requestId });
      }
      if (url.pathname.startsWith('/api/v1/operators/')) {
        const remainder = url.pathname.slice('/api/v1/operators/'.length);
        const [id, action] = remainder.split('/');
        if (!id || remainder.split('/').length > 2) return send(res, 404, { error: { code: 'NOT_FOUND', message: 'Operator route not found' }, requestId });
        if (req.method === 'GET' && !action) {
          requirePermission(context, 'operator:read');
          requireOperatorAccess(context, id);
          return send(res, 200, { data: await operatorService.get(id), requestId });
        }
        if (req.method === 'POST' && action) {
          const operator = await operatorService.get(id);
          requireProvinceAccess(context, operator.provinceCode);
          const body = await readJson(req);
          if (action === 'approve') {
            requirePermission(context, 'operator:approve');
            return send(res, 200, { data: await operatorService.approve(id, context.user.id, requestId), requestId });
          }
          if (action === 'reject') {
            requirePermission(context, 'operator:approve');
            return send(res, 200, { data: await operatorService.reject(id, requiredString(body.reason, 'reason'), context.user.id, requestId), requestId });
          }
          if (action === 'compliance') {
            requirePermission(context, 'operator:manage_compliance');
            const status = body.status;
            if (typeof status !== 'string') return send(res, 400, { error: { code: 'VALIDATION_ERROR', message: 'status is required' }, requestId });
            return send(res, 200, { data: await operatorService.updateCompliance(id, status as ComplianceStatus, typeof body.note === 'string' ? body.note : undefined, context.user.id, requestId), requestId });
          }
          if (action === 'suspend') {
            requirePermission(context, 'operator:manage_status');
            return send(res, 200, { data: await operatorService.suspend(id, requiredString(body.reason, 'reason'), context.user.id, requestId), requestId });
          }
          if (action === 'close') {
            requirePermission(context, 'operator:manage_status');
            return send(res, 200, { data: await operatorService.close(id, requiredString(body.reason, 'reason'), context.user.id, requestId), requestId });
          }
        }
      }
      if (req.method === 'POST' && url.pathname === '/api/v1/operators') {
        requirePermission(context, 'operator:register');
        const body = await readJson(req);
        if (typeof body.legalName !== 'string' || typeof body.provinceCode !== 'string') return send(res, 400, { error: { code: 'VALIDATION_ERROR', message: 'legalName and provinceCode are required' }, requestId });
        requireProvinceAccess(context, body.provinceCode as ProvinceCode);
        const data = await operatorService.register({ legalName: body.legalName, tradingName: typeof body.tradingName === 'string' ? body.tradingName : undefined, provinceCode: body.provinceCode as ProvinceCode, actorId: context.user.id, requestId });
        return send(res, 201, { data, requestId });
      }
      if (req.method === 'GET' && url.pathname === '/api/v1/provinces') return send(res, 200, { data: await repositories.provinces.list(), requestId });
      return send(res, 404, { error: { code: 'NOT_FOUND', message: 'Route not found' }, requestId });
    } catch (error: any) {
      const status = error?.code === 'UNAUTHORIZED' ? 401 : error?.code === 'FORBIDDEN' ? 403 : error?.code === 'NOT_FOUND' ? 404 : error?.code === 'VALIDATION_ERROR' ? 400 : error?.code === 'CONFLICT' ? 409 : 500;
      return send(res, status, { error: { code: error?.code || 'INTERNAL_ERROR', message: status === 500 ? 'Internal server error' : error.message }, requestId });
    }
  });
}

function authenticate(req: IncomingMessage, requestId: string): AuthorizationContext {
  const subject = req.headers.authorization?.replace(/^Bearer\s+/i, '') || (process.env.NODE_ENV !== 'production' ? process.env.DEV_IDENTITY_SUBJECT : undefined);
  if (!subject) { const error: any = new Error('Authentication required'); error.code = 'UNAUTHORIZED'; throw error; }
  const roles = (process.env.DEV_IDENTITY_ROLES || 'platform_admin').split(',').map((role) => role.trim()).filter(Boolean);
  const user: AuthenticatedUser = { id: process.env.DEV_IDENTITY_USER_ID || '00000000-0000-0000-0000-000000000001', externalSubject: subject, email: process.env.DEV_IDENTITY_EMAIL || 'developer@pngtourism.local', displayName: 'Development User', roles: roles as AuthenticatedUser['roles'] };
  return { user, requestId };
}

function requiredString(body: Record<string, unknown>, field: string): string {
  if (typeof body[field] !== 'string' || !body[field].trim()) { const error: any = new Error(`${field} is required`); error.code = 'VALIDATION_ERROR'; throw error; }
  return body[field] as string;
}
async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> { const chunks: Buffer[] = []; for await (const chunk of req) chunks.push(Buffer.from(chunk)); try { const parsed: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8')); if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error(); return parsed as Record<string, unknown>; } catch { const error: any = new Error('Invalid JSON body'); error.code = 'VALIDATION_ERROR'; throw error; } }
function send(res: ServerResponse, status: number, body: unknown) { res.statusCode = status; res.end(JSON.stringify(body)); }
