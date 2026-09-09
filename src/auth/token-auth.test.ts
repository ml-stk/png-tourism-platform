import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { authenticateBearerToken } from './token-auth';

function token(claims: Record<string, unknown>, secret = 'test-secret') {
  const enc = (v: unknown) => Buffer.from(JSON.stringify(v)).toString('base64url');
  const header = enc({ alg: 'HS256', typ: 'JWT' });
  const body = enc(claims);
  const input = `${header}.${body}`;
  const signature = createHmac('sha256', secret).update(input).digest('base64url');
  return `Bearer ${input}.${signature}`;
}

describe('authenticateBearerToken', () => {
  it('verifies claims and maps authorization scope', () => {
    const user = authenticateBearerToken(token({ sub: 'user-1', email: 'u@example.com', name: 'User', roles: ['operator'], provinceCodes: ['NCD'], operatorIds: ['op-1'], exp: Math.floor(Date.now() / 1000) + 300 }), 'test-secret');
    expect(user.id).toBe('user-1');
    expect(user.roles).toEqual(['operator']);
    expect(user.provinceCodes).toEqual(['NCD']);
    expect(user.operatorIds).toEqual(['op-1']);
  });

  it('rejects tampered tokens', () => {
    expect(() => authenticateBearerToken(token({ sub: 'user-1' }).replace(/.$/, 'x'), 'test-secret')).toThrowError(/Invalid bearer token/);
  });

  it('rejects expired tokens', () => {
    expect(() => authenticateBearerToken(token({ sub: 'user-1', exp: Math.floor(Date.now() / 1000) - 1 }), 'test-secret')).toThrowError(/expired/);
  });
});
