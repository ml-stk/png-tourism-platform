import { describe, expect, it } from 'vitest';
import { CampaignEventService } from './campaign-event-service';
import type { ContentItem } from '../domain/types';

const item = (overrides: Partial<ContentItem> = {}): ContentItem => ({ id: crypto.randomUUID(), type: 'destination', title: 'Published destination', slug: 'published-destination', publicationStatus: 'published', version: 1, updatedAt: new Date().toISOString(), ...overrides });
function service(items: ContentItem[]) { const store = new Map(items.map(i => [i.id, i])); const repo = { list: async (o: any = {}) => ({ items: [...store.values()].filter(i => (!o.type || i.type === o.type) && (!o.provinceCode || i.provinceCode === o.provinceCode) && (!o.publicationStatus || i.publicationStatus === o.publicationStatus)) }), getById: async (id: string) => store.get(id) || null, save: async (i: ContentItem) => { store.set(i.id, i); return i; }, update: async (i: ContentItem, expectedVersion?: number) => { const current = store.get(i.id); if (!current || (expectedVersion && current.version !== expectedVersion)) return null; store.set(i.id, i); return i; } }; const audit = { record: async () => undefined }; return new CampaignEventService(repo, audit); }

describe('CampaignEventService', () => {
  it('rejects an event whose end is before its start', async () => { const s = service([]); await expect(s.createEvent({ title: 'Festival', slug: 'festival', provinceCode: 'NCD', startsAt: '2026-10-02T10:00:00Z', endsAt: '2026-10-02T09:00:00Z', actorId: 'admin' })).rejects.toMatchObject({ code: 'VALIDATION_ERROR' }); });
  it('requires campaigns to reference published content', async () => { const draft = item({ publicationStatus: 'draft' }); const s = service([draft]); await expect(s.createCampaign({ title: 'Campaign', slug: 'campaign', linkedContentIds: [draft.id], actorId: 'admin' })).rejects.toMatchObject({ code: 'VALIDATION_ERROR' }); });
  it('lists only published activations for public discovery', async () => { const published = item({ type: 'event' }); const draft = item({ type: 'event', publicationStatus: 'draft' }); const s = service([published, draft]); const result = await s.list({ type: 'event', publishedOnly: true }); expect(result.map(x => x.id)).toEqual([published.id]); });
});
