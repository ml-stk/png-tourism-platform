import type { ContentItem, Destination, Operator, OperatorStatus, Province, PublicationStatus } from '../domain/types';

export interface OperatorRepository {
  list(options?: { provinceCode?: string; status?: string; cursor?: string; limit?: number }): Promise<{ items: Operator[]; nextCursor?: string }>;
  getById(id: string): Promise<Operator | null>;
  save(operator: Operator): Promise<Operator>;
  update(operator: Operator, expectedStatus?: OperatorStatus): Promise<Operator | null>;
}

export interface DestinationRepository {
  list(options?: { provinceCode?: string; publicationStatus?: PublicationStatus; cursor?: string; limit?: number }): Promise<{ items: Destination[]; nextCursor?: string }>;
  getById(id: string): Promise<Destination | null>;
}

export interface ProvinceRepository { list(): Promise<Province[]>; getByCode(code: string): Promise<Province | null>; }

export interface ContentRepository {
  list(options?: { type?: ContentItem['type']; publicationStatus?: PublicationStatus; cursor?: string; limit?: number }): Promise<{ items: ContentItem[]; nextCursor?: string }>;
  getById(id: string): Promise<ContentItem | null>;
  save(item: ContentItem): Promise<ContentItem>;
  update(item: ContentItem, expectedVersion?: number): Promise<ContentItem | null>;
}

export interface AuditWriter {
  record(event: { actorId?: string; action: string; targetType: string; targetId: string; outcome: 'success' | 'failure'; requestId?: string; metadata?: Record<string, unknown> }): Promise<void>;
}
