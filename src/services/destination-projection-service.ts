import { DomainError } from '../domain/errors';
import type { ProvinceCode } from '../domain/types';
import type { PostgresDestinationProjectionRepository } from '../persistence/destination-projection-repository';

export class DestinationProjectionService {
  constructor(private readonly repository: PostgresDestinationProjectionRepository) {}
  async list(provinceCode?: ProvinceCode) { return this.repository.listPublished(provinceCode); }
  async get(slug: string) {
    const item = await this.repository.getPublished(slug);
    if (!item) throw new DomainError('NOT_FOUND', 'Published destination not found');
    return item;
  }
}
