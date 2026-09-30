import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { handleCoreApi } from './api';
import { handleIndustryApi } from './industry-api';
import { handleOperatorRegistrationApi } from './operator-registration-api';
import { handleVisitorEngagementApi } from './visitor-engagement-api';
import { handlePassportApi } from './passport-api';
import { handleCommandCentreApi } from './command-centre-api';
import { handleCampaignEventApi } from './campaign-event-api';
import { handleContentStudioApi } from './content-studio-api';
import { handleDestinationPublicApi } from './destination-public-api';
import { handleMediaApi } from './media-api';
import { handleNtdpEnterpriseApi } from './ntdp-enterprise-api';
import { handleNtdpRegulatoryApi } from './ntdp-regulatory-api';
import { handleNtdpDistributionApi } from './ntdp-distribution-api';
import { handleNtdpCommerceApi } from './ntdp-commerce-api';
import { handleNtdpApiGatewayApi } from './ntdp-api-gateway-api';
import { handleAiConciergePublicApi } from './ai-concierge-public-api';
import { NtdpApiGatewayService } from '../services/ntdp-api-gateway-service';
import { applyCors, applySecurityHeaders, enforceRateLimit, requestBodyLimit } from './security';
import { healthResponse } from './health';

const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 8000, query_timeout: 15000 });
const gateway = new NtdpApiGatewayService(pool);
const handlers = [handleNtdpApiGatewayApi, handleNtdpDistributionApi, handleNtdpCommerceApi,
  handleNtdpRegulatoryApi, handleNtdpEnterpriseApi, handleAiConciergePublicApi,
  handleOperatorRegistrationApi, handleIndustryApi, handleVisitorEngagementApi, handlePassportApi,
  handleCommandCentreApi, handleCampaignEventApi, handleMediaApi, handleContentStudioApi, handleDestinationPublicApi];

export function createApplicationServer() {
  return createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const started = Date.now();
    const suppliedId = req.headers['x-request-id'];
    const requestId = typeof suppliedId === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(suppliedId) ? suppliedId : randomUUID();
    req.headers['x-request-id'] = requestId;
    res.setHeader('x-request-id', requestId);
    res.setHeader('content-type', 'application/json; charset=utf-8');
    applySecurityHeaders(res);
    if (!applyCors(req, res)) return;
    let routeKey: string | undefined;
    let clientId: string | undefined;
    let apiKeyId: string | undefined;
    const originalUrl = req.url || '/';
    try {
      requestBodyLimit(req);
      const url = new URL(originalUrl, 'http://localhost');
      if (req.method === 'GET' && url.pathname === '/health') { res.end(JSON.stringify(healthResponse())); return; }
      if (req.method === 'GET' && url.pathname === '/ready') {
        try { await pool.query('select id from operators limit 0'); }
        catch { res.statusCode = 503; res.end(JSON.stringify({ status: 'unavailable' })); return; }
        res.end(JSON.stringify({ status: 'ready' })); return;
      }
      if (url.pathname.startsWith('/api/v1/ntdp/') && !enforceRateLimit(req, res)) return;
      if (!url.pathname.startsWith('/api/v1/ntdp/gateway') && url.pathname !== '/api/v1/ai/concierge') {
        const auth = await gateway.authorizeRequest({ method: req.method || 'GET', path: url.pathname, apiKey: req.headers['x-api-key']?.toString() });
        routeKey = auth.routeKey;
        if ('clientId' in auth) { clientId = auth.clientId; apiKeyId = auth.apiKeyId; }
        if (url.pathname.startsWith('/api/v1/partner/') && routeKey === 'unregistered') {
          res.statusCode = 404; res.end(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Partner route not registered' }, requestId })); return;
        }
        if (routeKey === 'partner-destinations' || routeKey === 'partner-content') req.url = originalUrl.replace('/api/v1/partner/', '/api/v1/public/');
      }
      for (const handler of handlers) if (await handler(req, res)) return;
      await handleCoreApi(req, res);
    } catch (error: any) {
      if (res.writableEnded) return;
      res.statusCode = ({ UNAUTHORIZED: 401, FORBIDDEN: 403, NOT_FOUND: 404, VALIDATION_ERROR: 400, CONFLICT: 409, RATE_LIMITED: 429 } as Record<string, number>)[error?.code] || 500;
      if (res.statusCode === 429) res.setHeader('retry-after', '60');
      res.end(JSON.stringify({ error: { code: error?.code || 'INTERNAL_ERROR', message: res.statusCode === 500 ? 'Internal server error' : error.message }, requestId }));
    } finally {
      if (!originalUrl.startsWith('/health') && !originalUrl.startsWith('/ready')) {
        await gateway.logRequest({ requestId, clientId, apiKeyId, method: req.method || 'GET', routeKey, path: originalUrl.split('?')[0], statusCode: res.statusCode, latencyMs: Date.now() - started }).catch(error => console.error('Gateway request logging failed', error.code || 'UNKNOWN'));
      }
    }
  });
}
