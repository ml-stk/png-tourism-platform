import { DomainError } from '../domain/errors';
import type { ContentItem, Destination, Operator } from '../domain/types';
import type { ContentRepository, DestinationRepository, OperatorRepository } from './contracts';

export interface PublicVisitorServiceDeps { destinations: DestinationRepository; content: ContentRepository; operators: OperatorRepository; }

export class PublicVisitorService {
  constructor(private readonly deps: PublicVisitorServiceDeps) {}
  async destinationsList(options?: { provinceCode?: string; cursor?: string; limit?: number }) {
    return this.deps.destinations.list({ ...options, publicationStatus: 'published' });
  }
  async destination(id: string): Promise<Destination> {
    const item = await this.deps.destinations.getById(id);
    if (!item || item.publicationStatus !== 'published') throw new DomainError('NOT_FOUND', 'Destination not found');
    return item;
  }
  async contentList(options?: { type?: ContentItem['type']; cursor?: string; limit?: number }) {
    return this.deps.content.list({ ...options, publicationStatus: 'published' });
  }
  async content(id: string): Promise<ContentItem> {
    const item = await this.deps.content.getById(id);
    if (!item || item.publicationStatus !== 'published') throw new DomainError('NOT_FOUND', 'Content item not found');
    return item;
  }
  async operatorsList(options?: { provinceCode?: string; cursor?: string; limit?: number }) {
    const result = await this.deps.operators.list({ ...options, status: 'active' });
    return { ...result, items: result.items.filter(isPublicOperator).map(toPublicOperator) };
  }
  async operator(id: string): Promise<PublicOperator> {
    const item = await this.deps.operators.getById(id);
    if (!item || !isPublicOperator(item)) throw new DomainError('NOT_FOUND', 'Operator not found');
    return toPublicOperator(item);
  }
}

type PublicOperator = Pick<Operator, 'id' | 'tradingName' | 'provinceCode'>;
function isPublicOperator(operator: Operator) { return operator.status === 'active' && operator.complianceStatus === 'compliant' && Boolean(operator.tradingName); }
function toPublicOperator(operator: Operator): PublicOperator { return { id: operator.id, tradingName: operator.tradingName, provinceCode: operator.provinceCode }; }
