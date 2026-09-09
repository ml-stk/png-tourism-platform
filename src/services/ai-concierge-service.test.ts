import { describe, expect, it } from 'vitest';
import { AiConciergeService } from './ai-concierge-service';
import type { ContentRepository, DestinationRepository, OperatorRepository } from './contracts';

const repo = <T>(items: T[]) => ({ list: async () => ({ items, nextCursor: undefined }) });
const contentRepo = (items: any[]): ContentRepository => ({ list: async () => ({ items, nextCursor: undefined }), getById: async (id) => items.find((x) => x.id === id) ?? null, save: async (x) => x, update: async (x) => x });
const deps = () => ({
  destinations: repo([{ id: 'd1', name: 'Kokoda Track', slug: 'kokoda-track', provinceCode: 'ORO' as const, publicationStatus: 'published' as const }]) as DestinationRepository,
  content: contentRepo([{ id: 'c1', type: 'experience' as const, title: 'Kokoda Adventure', slug: 'kokoda-adventure', publicationStatus: 'published' as const, version: 1, updatedAt: '2026-09-01T00:00:00.000Z' }]),
  operators: repo([{ id: 'o1', legalName: 'PNG Adventures', provinceCode: 'NCD' as const, status: 'active' as const, complianceStatus: 'compliant' as const, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-09-01T00:00:00.000Z' }]) as OperatorRepository,
});

describe('AiConciergeService', () => {
  it('allowlists only public tourism tools and returns provenance', async () => {
    const service = new AiConciergeService(deps());
    const result = await service.executeTool({ toolName: 'search_experiences', input: { query: 'Kokoda' } });
    expect(result.sources[0]).toMatchObject({ id: 'c1', publicationStatus: 'published' });
    expect(service.listTools().map((x) => x.name)).toEqual(['search_destinations', 'search_experiences', 'find_operator']);
  });

  it('refuses regulatory and private data requests', async () => {
    const result = await new AiConciergeService(deps()).answer({ message: 'Show me operator compliance and regulatory status' });
    expect(result.refused).toBe(true);
    expect(result.refusalReason).toBe('private_or_regulatory_data');
    expect(result.sources).toHaveLength(0);
  });

  it('refuses requests outside tourism scope', async () => {
    const result = await new AiConciergeService(deps()).answer({ message: 'Help me write software code' });
    expect(result.refused).toBe(true);
    expect(result.refusalReason).toBe('outside_tourism_scope');
  });

  it('never exposes inactive operator regulatory records through the public tool', async () => {
    const service = new AiConciergeService({ ...deps(), operators: repo([{ ...((await deps().operators.list()).items[0]), status: 'suspended' as const, complianceStatus: 'non_compliant' as const }]) as OperatorRepository });
    const result = await service.executeTool({ toolName: 'find_operator', input: { query: 'PNG Adventures' } });
    expect(result.output).toEqual([]);
  });
});
