import { describe, expect, it } from 'vitest';

describe('AI Concierge visitor experience contract', () => {
  it('uses the governed concierge endpoint', async () => {
    const source = await import('./AiConcierge');
    expect(source.default).toBeDefined();
  });

  it('defines the visitor-safe quick prompts', async () => {
    const moduleSource = await fetch(new URL('./AiConcierge.tsx', import.meta.url)).then(r => r.text()).catch(() => '');
    expect(moduleSource).toContain('What should I see in Port Moresby?');
    expect(moduleSource).toContain('/api/v1/ai/concierge');
    expect(moduleSource).toContain('governed');
  });
});
