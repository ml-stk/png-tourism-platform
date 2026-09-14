import { describe, expect, it } from 'vitest';
import { withNtdpPagination } from './ntdp-pagination';

function responseMock() {
  const headers = new Map<string, string>();
  const response: any = {
    statusCode: 200,
    setHeader(name: string, value: string) { headers.set(name.toLowerCase(), value); },
    get headers() { return headers; },
    end(chunk?: unknown) { response.body = chunk?.toString(); return response; },
  };
  return response;
}

describe('NTDP pagination', () => {
  it('returns a bounded page and pagination metadata for high-growth lists', async () => {
    const req: any = { method: 'GET', url: '/api/v1/ntdp/membership?page=2&pageSize=2' };
    const res = responseMock();
    await withNtdpPagination(req, res, async () => {
      res.end(JSON.stringify({ data: [1, 2, 3, 4, 5] }));
    });
    const body = JSON.parse(res.body);
    expect(body.data).toEqual([3, 4]);
    expect(body.pagination).toEqual({ page: 2, pageSize: 2, total: 5, totalPages: 3, hasNext: true, hasPrevious: true });
    expect(res.headers.get('x-pagination-total')).toBe('5');
  });

  it('does not alter non-paginated routes', async () => {
    const req: any = { method: 'GET', url: '/api/v1/ntdp/commerce/readiness' };
    const res = responseMock();
    await withNtdpPagination(req, res, async () => {
      res.end(JSON.stringify({ data: [1, 2, 3] }));
    });
    expect(JSON.parse(res.body)).toEqual({ data: [1, 2, 3] });
  });
});
