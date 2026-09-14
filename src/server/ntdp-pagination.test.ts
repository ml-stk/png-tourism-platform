import { describe, expect, it } from 'vitest';
import { withNtdpPagination } from './ntdp-pagination';

function mockResponse() {
  const headers = new Map<string, string>();
  const res: any = {
    statusCode: 200,
    setHeader: (name: string, value: string) => headers.set(name, value),
    headers,
    end(chunk?: unknown) {
      res.body = Buffer.isBuffer(chunk) ? chunk.toString('utf8') : chunk;
      return res;
    },
  };
  return res;
}

describe('NTDP pagination', () => {
  it('paginates collection responses with bounded page size', async () => {
    const req: any = {
      method: 'GET',
      url: '/api/v1/ntdp/membership?page=2&pageSize=2',
    };
    const res = mockResponse();

    await withNtdpPagination(req, res, async () => {
      res.end(JSON.stringify({ data: [1, 2, 3, 4, 5], requestId: 'req-1' }));
    });

    const body = JSON.parse(res.body);
    expect(body.data).toEqual([3, 4]);
    expect(body.pagination).toEqual({
      page: 2,
      pageSize: 2,
      total: 5,
      totalPages: 3,
      hasNext: true,
      hasPrevious: true,
    });
    expect(body.requestId).toBe('req-1');
  });

  it('leaves non-paginated routes unchanged', async () => {
    const req: any = { method: 'GET', url: '/api/v1/public/destinations' };
    const res = mockResponse();

    await withNtdpPagination(req, res, async () => {
      res.end(JSON.stringify({ data: [1, 2, 3] }));
    });

    expect(JSON.parse(res.body)).toEqual({ data: [1, 2, 3] });
  });
});
