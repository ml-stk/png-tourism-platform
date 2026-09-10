import { describe, expect, it } from 'vitest';
import type { AiConversationResponse } from '../domain/ai';

describe('AI Concierge visitor response contract', () => {
  it('supports governed source-backed responses and refusals', () => {
    const response: AiConversationResponse = {
      sessionId: 'session',
      answer: 'Published tourism information.',
      sources: [{ id: 'destination-1', kind: 'public_destination', title: 'Example', provenance: 'destination:destination-1:v1', publicationStatus: 'published' }],
      modelVersion: 'governed-adapter-v1',
      promptVersion: 'concierge-v1',
      governed: true,
      refused: false,
    };
    expect(response.governed).toBe(true);
    expect(response.sources.every(source => source.publicationStatus === 'published')).toBe(true);
  });

  it('represents a governed refusal without sources', () => {
    const response: AiConversationResponse = {
      sessionId: 'session',
      answer: 'I cannot provide that information.',
      sources: [],
      modelVersion: 'governed-adapter-v1',
      promptVersion: 'concierge-v1',
      governed: true,
      refused: true,
      refusalReason: 'private_or_regulatory_data',
    };
    expect(response.refused).toBe(true);
    expect(response.sources).toHaveLength(0);
  });
});
