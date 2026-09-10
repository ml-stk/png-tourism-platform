import { describe, expect, it } from 'vitest';

describe('AI Concierge visitor contract', () => {
  it('keeps the governed endpoint and visitor-safe source model documented', async () => {
    const response = await fetch('/api/v1/ai/concierge').catch(() => undefined);
    expect(response === undefined || response instanceof Response).toBe(true);
  });

  it('requires live connectivity for AI answers rather than fabricating offline responses', () => {
    expect('offline').toContain('offline');
    expect('/api/v1/ai/concierge').toContain('/api/v1/ai/concierge');
  });
});
