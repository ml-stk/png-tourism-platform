import type { IncomingMessage, ServerResponse } from 'node:http';

const PAGINATED_PATHS = new Set([
  '/api/v1/ntdp/warehouse/metrics',
  '/api/v1/ntdp/warehouse/etl-runs',
  '/api/v1/ntdp/gis/assets',
  '/api/v1/ntdp/membership',
  '/api/v1/ntdp/distribution',
  '/api/v1/ntdp/regulatory/licenses',
  '/api/v1/ntdp/regulatory/inspections',
  '/api/v1/ntdp/regulatory/compliance-actions',
  '/api/v1/ntdp/distribution/partners',
]);

export async function withNtdpPagination(
  req: IncomingMessage,
  res: ServerResponse,
  handler: () => Promise<void>,
): Promise<void> {
  if (req.method !== 'GET') {
    await handler();
    return;
  }

  const parsed = new URL(req.url || '/', 'http://localhost');
  if (!PAGINATED_PATHS.has(parsed.pathname)) {
    await handler();
    return;
  }

  const page = boundedInteger(parsed.searchParams.get('page'), 1, 1, 100000);
  const pageSize = boundedInteger(parsed.searchParams.get('pageSize'), 50, 1, 100);
  const chunks: Buffer[] = [];
  const originalEnd = res.end.bind(res);

  res.end = ((chunk?: any, encoding?: any, callback?: any) => {
    if (res.statusCode >= 200 && res.statusCode < 300 && chunk !== undefined) {
      const raw = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk), encoding);
      try {
        const body = JSON.parse(raw.toString('utf8')) as Record<string, unknown>;
        if (Array.isArray(body.data)) {
          const total = body.data.length;
          const start = (page - 1) * pageSize;
          const data = body.data.slice(start, start + pageSize);
          body.data = data;
          body.pagination = {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
            hasNext: start + data.length < total,
            hasPrevious: page > 1,
          };
          const output = Buffer.from(JSON.stringify(body));
          res.setHeader('content-type', 'application/json; charset=utf-8');
          res.setHeader('x-pagination-page', String(page));
          res.setHeader('x-pagination-page-size', String(pageSize));
          res.setHeader('x-pagination-total', String(total));
          return originalEnd(output, undefined, callback);
        }
      } catch {
        // Preserve the original response when it is not a JSON collection.
      }
      chunks.push(raw);
    }
    return originalEnd(chunk, encoding, callback);
  }) as typeof res.end;

  await handler();
}

function boundedInteger(value: string | null, fallback: number, min: number, max: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}
