import type { Operator, ProvinceCode } from '../domain/types';
import { DomainError } from '../domain/errors';
import type { AuditWriter, OperatorRepository } from './contracts';

export class OperatorService {
  constructor(
    private readonly repository: OperatorRepository,
    private readonly audit: AuditWriter,
  ) {}

  async get(id: string): Promise<Operator> {
    const operator = await this.repository.getById(id);
    if (!operator) throw new DomainError('NOT_FOUND', 'Operator not found');
    return operator;
  }

  async register(input: {
    legalName: string;
    tradingName?: string;
    provinceCode: ProvinceCode;
    actorId?: string;
    requestId?: string;
  }): Promise<Operator> {
    const legalName = input.legalName.trim();
    if (!legalName) throw new DomainError('VALIDATION_ERROR', 'Legal name is required');

    const now = new Date().toISOString();
    const operator: Operator = {
      id: crypto.randomUUID(),
      legalName,
      tradingName: input.tradingName?.trim() || undefined,
      provinceCode: input.provinceCode,
      status: 'pending_review',
      complianceStatus: 'unknown',
      createdAt: now,
      updatedAt: now,
    };

    const saved = await this.repository.save(operator);
    await this.audit.record({
      actorId: input.actorId,
      action: 'operator.registered',
      targetType: 'operator',
      targetId: saved.id,
      outcome: 'success',
      requestId: input.requestId,
    });
    return saved;
  }
}
