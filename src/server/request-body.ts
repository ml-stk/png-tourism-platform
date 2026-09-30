import type { IncomingMessage } from 'node:http';

export async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  const configured = Number(process.env.REQUEST_BODY_MAX_BYTES || 1_048_576);
  const limit = Number.isSafeInteger(configured) && configured > 0 ? configured : 1_048_576;
  let bytes = 0;
  for await (const value of req) {
    const chunk = Buffer.from(value);
    bytes += chunk.length;
    if (bytes > limit) throw Object.assign(new Error('Request body exceeds maximum size'), { code: 'VALIDATION_ERROR' });
    chunks.push(chunk);
  }
  try {
    const value: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
    return value as Record<string, unknown>;
  } catch {
    throw Object.assign(new Error('Invalid JSON body'), { code: 'VALIDATION_ERROR' });
  }
}
