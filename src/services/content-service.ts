import { randomUUID } from 'node:crypto';
import { DomainError } from '../domain/errors';
import type { ContentItem, Destination, PublicationStatus, ProvinceCode } from '../domain/types';
import type { AuditWriter, ContentRepository, DestinationRepository } from './contracts';

export interface DestinationWriter extends DestinationRepository {
  save(destination: Destination): Promise<Destination>;
  update(destination: Destination): Promise<Destination | null>;
}

export class DestinationService {
  constructor(private readonly repository: DestinationWriter, private readonly audit: AuditWriter) {}
  async list(options?: Parameters<DestinationRepository['list']>[0]) { return this.repository.list(options); }
  async get(id: string) { const item = await this.repository.getById(id); if (!item) throw new DomainError('NOT_FOUND', 'Destination not found'); return item; }
  async create(input: { name: string; slug: string; provinceCode: ProvinceCode; description?: string; latitude?: number; longitude?: number; actorId: string; requestId?: string }) {
    const name = input.name.trim(); const slug = input.slug.trim().toLowerCase();
    if (!name || !slug) throw new DomainError('VALIDATION_ERROR', 'name and slug are required');
    const now = new Date().toISOString();
    const item: Destination = { id: randomUUID(), name, slug, provinceCode: input.provinceCode, publicationStatus: 'draft', description: input.description?.trim() || undefined, latitude: input.latitude, longitude: input.longitude, contentVersion: 1, updatedAt: now };
    const saved = await this.repository.save(item);
    await this.audit.record({ actorId: input.actorId, action: 'destination.created', targetType: 'destination', targetId: saved.id, outcome: 'success', requestId: input.requestId });
    return saved;
  }
  async update(id: string, patch: Partial<Pick<Destination, 'name'|'slug'|'description'|'latitude'|'longitude'|'provinceCode'>>, actorId: string, requestId?: string) {
    const current = await this.get(id);
    const updated = await this.repository.update({ ...current, ...patch, name: patch.name?.trim() || current.name, slug: patch.slug?.trim().toLowerCase() || current.slug, contentVersion: current.contentVersion + 1, updatedAt: new Date().toISOString() });
    if (!updated) throw new DomainError('CONFLICT', 'Destination changed; retry with current state');
    await this.audit.record({ actorId, action: 'destination.updated', targetType: 'destination', targetId: id, outcome: 'success', requestId }); return updated;
  }
  async setPublication(id: string, status: PublicationStatus, actorId: string, requestId?: string) {
    const current = await this.get(id);
    const allowed: Record<PublicationStatus, PublicationStatus[]> = { draft: ['review'], review: ['draft','published'], published: ['archived','draft'], archived: ['draft'] };
    if (!['draft','review','published','archived'].includes(status)) throw new DomainError('VALIDATION_ERROR', 'Invalid publication status');
    if (status !== current.publicationStatus && !allowed[current.publicationStatus].includes(status)) throw new DomainError('CONFLICT', `Invalid publication transition: ${current.publicationStatus} -> ${status}`);
    const updated = await this.repository.update({ ...current, publicationStatus: status, contentVersion: current.contentVersion + 1, updatedAt: new Date().toISOString() });
    if (!updated) throw new DomainError('CONFLICT', 'Destination changed; retry with current state');
    await this.audit.record({ actorId, action: `destination.${status}`, targetType: 'destination', targetId: id, outcome: 'success', requestId }); return updated;
  }
}

export class ContentService {
  constructor(private readonly repository: ContentRepository, private readonly audit: AuditWriter) {}
  async list(options?: Parameters<ContentRepository['list']>[0]) { return this.repository.list(options); }
  async get(id: string) { const item = await this.repository.getById(id); if (!item) throw new DomainError('NOT_FOUND', 'Content item not found'); return item; }
  async create(input: { type: ContentItem['type']; title: string; slug: string; provinceCode?: ProvinceCode; summary?: string; body?: string; actorId: string; requestId?: string }) {
    const title = input.title.trim(); const slug = input.slug.trim().toLowerCase();
    if (!title || !slug) throw new DomainError('VALIDATION_ERROR', 'title and slug are required');
    const item: ContentItem = { id: randomUUID(), type: input.type, title, slug, publicationStatus: 'draft', version: 1, updatedAt: new Date().toISOString(), provinceCode: input.provinceCode, summary: input.summary?.trim() || undefined, body: input.body?.trim() || undefined };
    const saved = await this.repository.save(item); await this.audit.record({ actorId: input.actorId, action: 'content.created', targetType: 'content', targetId: saved.id, outcome: 'success', requestId }); return saved;
  }
  async setPublication(id: string, status: PublicationStatus, actorId: string, requestId?: string) {
    const current = await this.get(id);
    if (status === 'published' && current.publicationStatus !== 'review') throw new DomainError('CONFLICT', 'Content must be in review before publication');
    const now = new Date().toISOString();
    const updated = await this.repository.update({ ...current, publicationStatus: status, version: current.version + 1, updatedAt: now, ...(status === 'published' ? { publishedAt: now, publishedBy: actorId } : {}) }, current.version);
    if (!updated) throw new DomainError('CONFLICT', 'Content changed; retry with current state');
    await this.audit.record({ actorId, action: `content.${status}`, targetType: 'content', targetId: id, outcome: 'success', requestId }); return updated;
  }
}
