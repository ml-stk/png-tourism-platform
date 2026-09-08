import type { ComplianceStatus, Operator, OperatorStatus, ProvinceCode } from '../domain/types';
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
    await this.audit.record({ actorId: input.actorId, action: 'operator.registered', targetType: 'operator', targetId: saved.id, outcome: 'success', requestId: input.requestId });
    return saved;
  }

  async approve(id: string, actorId?: string, requestId?: string): Promise<Operator> {
    return this.transition(id, 'pending_review', 'active', 'operator.approved', actorId, requestId);
  }

  async reject(id: string, reason: string, actorId?: string, requestId?: string): Promise<Operator> {
    const normalizedReason = reason.trim();
    if (!normalizedReason) throw new DomainError('VALIDATION_ERROR', 'Rejection reason is required');
    return this.transition(id, 'pending_review', 'closed', 'operator.rejected', actorId, requestId, normalizedReason);
  }

  async updateCompliance(id: string, complianceStatus: ComplianceStatus, note: string | undefined, actorId?: string, requestId?: string): Promise<Operator> {
    if (!['unknown', 'compliant', 'conditional', 'non_compliant'].includes(complianceStatus)) {
      throw new DomainError('VALIDATION_ERROR', 'Invalid compliance status');
    }
    const operator = await this.get(id);
    if (operator.status === 'closed') throw new DomainError('CONFLICT', 'Closed operators cannot have compliance updated');
    if (note !== undefined && !note.trim()) throw new DomainError('VALIDATION_ERROR', 'Compliance note cannot be empty');
    const updated = await this.repository.update({ ...operator, complianceStatus, updatedAt: new Date().toISOString() }, operator.status);
    if (!updated) throw new DomainError('CONFLICT', 'Operator changed before compliance update could be applied');
    await this.audit.record({ actorId, action: 'operator.compliance_updated', targetType: 'operator', targetId: id, outcome: 'success', requestId });
    return updated;
  }

  async suspend(id: string, reason: string, actorId?: string, requestId?: string): Promise<Operator> {
    const normalizedReason = reason.trim();
    if (!normalizedReason) throw new DomainError('VALIDATION_ERROR', 'Suspension reason is required');
    return this.transition(id, 'active', 'suspended', 'operator.suspended', actorId, requestId, normalizedReason);
  }

  async close(id: string, reason: string, actorId?: string, requestId?: string): Promise<Operator> {
    const normalizedReason = reason.trim();
    if (!normalizedReason) throw new DomainError('VALIDATION_ERROR', 'Closure reason is required');
    return this.transition(id, 'suspended', 'closed', 'operator.closed', actorId, requestId, normalizedReason);
  }

  private async transition(
    id: string,
    expectedStatus: OperatorStatus,
    nextStatus: OperatorStatus,
    action: string,
    actorId?: string,
    requestId?: string,
    reason?: string,
  ): Promise<Operator> {
    const operator = await this.get(id);
    if (operator.status !== expectedStatus) throw new DomainError('CONFLICT', `Operator must be ${expectedStatus} to become ${nextStatus}`);
    const updated = await this.repository.update({ ...operator, status: nextStatus, updatedAt: new Date().toISOString() }, expectedStatus);
    if (!updated) throw new DomainError('CONFLICT', 'Operator changed before the lifecycle transition could be applied');
    await this.audit.record({ actorId, action, targetType: 'operator', targetId: id, outcome: 'success', requestId });
    return updated;
  }
}
