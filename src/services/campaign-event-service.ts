import { randomUUID } from 'node:crypto';
import { DomainError } from '../domain/errors';
import type { ContentItem, ProvinceCode, PublicationStatus } from '../domain/types';
import { toActivationItem, type TourismCampaign, type TourismEvent, type ActivationListItem } from '../domain/campaign-event';
import type { AuditWriter, ContentRepository } from './contracts';
import { ContentService } from './content-service';

type EventPayload = { startsAt: string; endsAt: string; venue?: string };
type CampaignPayload = { linkedContentIds: string[] };

export class CampaignEventService {
  private readonly content: ContentService;
  constructor(private readonly repository: ContentRepository, private readonly audit: AuditWriter) { this.content = new ContentService(repository, audit); }

  async list(options: { type?: 'event' | 'campaign'; provinceCode?: ProvinceCode; publishedOnly?: boolean } = {}): Promise<ActivationListItem[]> {
    const result = await this.repository.list({ type: options.type, provinceCode: options.provinceCode, publicationStatus: options.publishedOnly ? 'published' : undefined, limit: 100 });
    return result.items.map(toActivationItem).filter((item): item is ActivationListItem => item !== null);
  }

  async get(id: string): Promise<ContentItem> { return this.content.get(id); }

  async createEvent(input: Omit<TourismEvent, 'id' | 'publicationStatus' | 'version' | 'updatedAt'> & { actorId: string; requestId?: string }): Promise<ContentItem> {
    const startsAt = parseDate(input.startsAt, 'startsAt'); const endsAt = parseDate(input.endsAt, 'endsAt');
    if (endsAt <= startsAt) throw new DomainError('VALIDATION_ERROR', 'endsAt must be after startsAt');
    return this.content.create({ type: 'event', title: input.title, slug: input.slug, provinceCode: input.provinceCode, summary: input.summary, body: JSON.stringify({ startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString(), venue: input.venue?.trim() || undefined } satisfies EventPayload), actorId: input.actorId, requestId: input.requestId });
  }

  async createCampaign(input: Omit<TourismCampaign, 'id' | 'publicationStatus' | 'version' | 'updatedAt'> & { actorId: string; requestId?: string }): Promise<ContentItem> {
    const linkedContentIds = [...new Set(input.linkedContentIds.filter(v => typeof v === 'string' && v.trim()).map(v => v.trim()))].slice(0, 50);
    if (!linkedContentIds.length) throw new DomainError('VALIDATION_ERROR', 'At least one linked content item is required');
    const linked = await Promise.all(linkedContentIds.map(id => this.repository.getById(id)));
    if (linked.some(item => !item || item.publicationStatus !== 'published')) throw new DomainError('VALIDATION_ERROR', 'Campaign links must reference published content');
    if (input.provinceCode && linked.some(item => item?.provinceCode && item.provinceCode !== input.provinceCode)) throw new DomainError('VALIDATION_ERROR', 'Campaign links must remain within the campaign province');
    return this.content.create({ type: 'campaign', title: input.title, slug: input.slug, provinceCode: input.provinceCode, summary: input.summary, body: JSON.stringify({ linkedContentIds } satisfies CampaignPayload), actorId: input.actorId, requestId: input.requestId });
  }

  async publish(id: string, actorId: string, requestId?: string): Promise<ContentItem> {
    const item = await this.content.get(id);
    if (item.type !== 'event' && item.type !== 'campaign') throw new DomainError('VALIDATION_ERROR', 'Only events and campaigns can be activated here');
    if (item.type === 'event') { const payload = parseEvent(item.body); if (new Date(payload.endsAt) <= new Date()) throw new DomainError('VALIDATION_ERROR', 'Past events cannot be published'); }
    if (item.type === 'campaign') { const payload = parseCampaign(item.body); if (!payload.linkedContentIds.length) throw new DomainError('VALIDATION_ERROR', 'Campaign must contain published content'); }
    return this.content.setPublication(id, 'published', actorId, requestId);
  }

  async setStatus(id: string, status: PublicationStatus, actorId: string, requestId?: string): Promise<ContentItem> {
    const item = await this.content.get(id);
    if (item.type !== 'event' && item.type !== 'campaign') throw new DomainError('VALIDATION_ERROR', 'Only events and campaigns can be managed here');
    return this.content.setPublication(id, status, actorId, requestId);
  }
}

export function parseEvent(body?: string): EventPayload { try { const value = JSON.parse(body || '{}') as Partial<EventPayload>; if (typeof value.startsAt !== 'string' || typeof value.endsAt !== 'string') throw new Error(); return value as EventPayload; } catch { throw new DomainError('VALIDATION_ERROR', 'Event metadata is invalid'); } }
export function parseCampaign(body?: string): CampaignPayload { try { const value = JSON.parse(body || '{}') as Partial<CampaignPayload>; if (!Array.isArray(value.linkedContentIds)) throw new Error(); return { linkedContentIds: value.linkedContentIds.filter((v): v is string => typeof v === 'string') }; } catch { throw new DomainError('VALIDATION_ERROR', 'Campaign metadata is invalid'); } }
function parseDate(value: string, field: string): Date { const date = new Date(value); if (!value || Number.isNaN(date.getTime())) throw new DomainError('VALIDATION_ERROR', `${field} must be a valid ISO date`); return date; }
