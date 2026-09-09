import { describe, expect, it, vi } from 'vitest';
import { applySecurityHeaders, enforceRateLimit, requestBodyLimit } from './security';

describe('API security boundary', () => {
  it('sets defensive response headers', () => {
    const headers = new Map<string, string>();
    const res = { setHeader: (k: string, v: string) => headers.set(k, v) } as any;
    applySecurityHeaders(res);
    expect(headers.get('x-content-type-options')).toBe('nosniff');
    expect(headers.get('x-frame-options')).toBe('DENY');
    expect(headers.get('referrer-policy')).toBe('no-referrer');
  });

  it('rejects oversized declared request bodies', () => {
    const req = { headers: { 'content-length': '20' } } as any;
    expect(() => requestBodyLimit(req, 10)).toThrow(/maximum size/);
  });

  it('rate limits repeated requests', () => {
    const req = { headers: { 'x-forwarded-for': `198.51.100.${Date.now() % 250}` }, socket: {} } as any;
    const res = { setHeader: vi.fn(), end: vi.fn(), statusCode: 200 } as any;
    const previousWindow = process.env.RATE_LIMIT_WINDOW_MS;
    const previousMax = process.env.RATE_LIMIT_MAX_REQUESTS;
    process.env.RATE_LIMIT_WINDOW_MS = '60000';
    process.env.RATE_LIMIT_MAX_REQUESTS = '1';
    try {
      expect(enforceRateLimit(req, res)).toBe(true);
      expect(enforceRateLimit(req, res)).toBe(false);
      expect(res.statusCode).toBe(429);
    } finally {
      if (previousWindow === undefined) delete process.env.RATE_LIMIT_WINDOW_MS; else process.env.RATE_LIMIT_WINDOW_MS = previousWindow;
      if (previousMax === undefined) delete process.env.RATE_LIMIT_MAX_REQUESTS; else process.env.RATE_LIMIT_MAX_REQUESTS = previousMax;
    }
  });
});
