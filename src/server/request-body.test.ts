import { afterEach, expect, it, vi } from 'vitest';
import { Readable } from 'node:stream';
import type { IncomingMessage } from 'node:http';
import { readJson } from './request-body';
afterEach(() => vi.unstubAllEnvs());
it('bounds chunked bodies even without Content-Length', async () => {
  vi.stubEnv('REQUEST_BODY_MAX_BYTES', '10');
  await expect(readJson(Readable.from(['{"value":', '"too long"}']) as IncomingMessage)).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
});
it('accepts a valid JSON object and rejects scalar payloads', async () => {
  await expect(readJson(Readable.from(['{"ok":true}']) as IncomingMessage)).resolves.toEqual({ ok: true });
  await expect(readJson(Readable.from(['null']) as IncomingMessage)).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
});
