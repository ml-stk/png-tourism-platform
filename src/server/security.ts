import type { IncomingMessage, ServerResponse } from 'node:http';

interface Bucket { count: number; resetAt: number; }
const buckets = new Map<string, Bucket>();

export function applySecurityHeaders(res: ServerResponse): void {
  res.setHeader('x-content-type-options', 'nosniff');
  res.setHeader('x-frame-options', 'DENY');
  res.setHeader('referrer-policy', 'no-referrer');
  res.setHeader('cache-control', 'no-store');
  res.setHeader('permissions-policy', 'camera=(), microphone=(), geolocation=()');
  if (process.env.NODE_ENV === 'production') res.setHeader('strict-transport-security', 'max-age=31536000; includeSubDomains');
}

export function applyCors(req: IncomingMessage, res: ServerResponse): boolean {
  const origin = req.headers.origin;
  const allowed = (process.env.CORS_ALLOWED_ORIGIN || '').split(',').map(value => value.trim()).filter(Boolean);
  if (!origin || !allowed.includes(origin)) return !origin;
  res.setHeader('access-control-allow-origin', origin);
  res.setHeader('vary', 'Origin');
  res.setHeader('access-control-allow-methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('access-control-allow-headers', 'Authorization, Content-Type, Accept, X-Request-Id');
  res.setHeader('access-control-max-age', '600');
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return false; }
  return true;
}

export function enforceRateLimit(req: IncomingMessage, res: ServerResponse): boolean {
  const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
  const maxRequests = Number(process.env.RATE_LIMIT_MAX_REQUESTS || 120);
  const key = req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) buckets.set(key, { count: 1, resetAt: now + windowMs });
  else current.count += 1;
  const bucket = buckets.get(key)!;
  res.setHeader('x-ratelimit-limit', String(maxRequests));
  res.setHeader('x-ratelimit-remaining', String(Math.max(0, maxRequests - bucket.count)));
  if (bucket.count > maxRequests) {
    res.setHeader('retry-after', String(Math.ceil((bucket.resetAt - now) / 1000)));
    res.statusCode = 429;
    res.end(JSON.stringify({ error: { code: 'RATE_LIMITED', message: 'Too many requests' } }));
    return false;
  }
  return true;
}

export function requestBodyLimit(req: IncomingMessage, maxBytes = Number(process.env.REQUEST_BODY_MAX_BYTES || 1_048_576)): void {
  const declared = Number(req.headers['content-length'] || 0);
  if (declared > maxBytes) {
    const error: Error & { code?: string } = new Error('Request body exceeds maximum size');
    error.code = 'VALIDATION_ERROR';
    throw error;
  }
}

export function resetRateLimitBucketsForTests(): void {
  buckets.clear();
}
