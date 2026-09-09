import { describe, expect, it } from 'vitest';
import type { ContentItem, Destination } from '../domain/types';
import { OfflineService } from './offline-service';
import type { ContentRepository, DestinationRepository } from './contracts';

const destination = (id: string, publicationStatus: Destination['publicationStatus'], provinceCode: Destination['provinceCode']): Destination => ({ id, name: `Destination ${id}`, slug: id, provinceCode, publicationStatus });
const content = (id: string, publicationStatus: ContentItem['publicationStatus']): ContentItem => ({ id, type: 'experience', title: `Experience ${id}`, slug: id, publicationStatus, version: 1, updatedAt: '2026-01-01T00:00:00.000Z' });

const deps = (destinations: Destination[], contentItems: ContentItem[]) => ({
  destinations: { list: async (options?: { provinceCode?: string }) => ({ items: destinations.filter((d) => !options?.provinceCode || d.provinceCode === options.provinceCode), nextCursor: undefined }), getById: async () => null } satisfies DestinationRepository,
  content: { list: async () => ({ items: contentItems, nextCursor: undefined }), getById: async () => null, save: async () => contentItems[0], update: async () => contentItems[0] } satisfies ContentRepository,
} as { destinations: DestinationRepository; content: ContentRepository });

describe('OfflineService', () => {
  it('builds a province-scoped manifest using only published destinations', async () => {
    const service = new OfflineService(deps([
      destination('d1', 'published', 'NCD'),
      destination('d2', 'draft', 'NCD'),
      destination('d3', 'published', 'CENTRAL'),
    ], [content('c1', 'published'), content('c2', 'draft')]));

    const manifest = await service.buildManifest({ channel: 'provincial', provinceCode: 'NCD', now: new Date('2026-09-09T00:00:00.000Z') });

    expect(manifest.channel).toBe('provincial');
    expect(manifest.provinceCode).toBe('NCD');
    expect(manifest.records.map((r) => r.id)).toEqual(['d1', 'c1']);
    expect(manifest.records.every((r) => r.payload.publicationStatus === 'published')).toBe(true);
  });

  it('rejects a provincial manifest without a province', async () => {
    const service = new OfflineService(deps([], []));
    await expect(service.buildManifest({ channel: 'provincial' })).rejects.toThrow('Province code is required');
  });

  it('marks a sync stale after the configured threshold', () => {
    const service = new OfflineService(deps([], []));
    const state = service.syncState('2026-09-07T00:00:00.000Z', new Date('2026-09-09T01:00:00.000Z'), 24 * 60 * 60);
    expect(state.health).toBe('stale');
  });

  it('generates a stable QR handoff URI without exposing regulatory data', () => {
    const service = new OfflineService(deps([], []));
    const handoff = service.createQrHandoff('destination', 'dest/123', new Date('2026-09-10T00:00:00.000Z'));
    expect(handoff.uri).toBe('pngtourism://handoff/destination/dest%2F123');
    expect(handoff.expiresAt).toBe('2026-09-10T00:00:00.000Z');
  });

  it('supports an explicit offline state while preserving last successful sync', () => {
    const service = new OfflineService(deps([], []));
    const state = service.offlineState('2026-09-08T00:00:00.000Z');
    expect(state.health).toBe('offline');
    expect(state.lastSuccessfulSyncAt).toBe('2026-09-08T00:00:00.000Z');
  });
});
