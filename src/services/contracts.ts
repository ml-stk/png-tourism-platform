import type { Destination, Operator, OperatorStatus, Province } from '../domain/types';

export interface OperatorRepository {
  list(options?: { provinceCode?: string; status?: string; cursor?: string; limit?: number }): Promise<{ items: Operator[]; nextCursor?: string }>;
  getById(id: string): Promise<Operator | null>;
  save(operator: Operator): Promise<Operator>;
  update(operator: Operator, expectedStatus?: OperatorStatus): Promise<Operator | null>;
}

export interface DestinationRepository {
  list(options?: { provinceCode?: string; cursor?: string; limit?: number }): Promise<{ items: Destination[]; nextCursor?: string }>;
  getById(id: string): Promise<Destination | null>;
}

export interface ProvinceRepository {
  list(): Promise<Province[]>;
  getByCode(code: string): Promise<Province | null>;
}

export interface AuditWriter {
  record(event: {
    actorId?: string;
    action: string;
    targetType: string;
    targetId: string;
    outcome: 'success' | 'failure';
    requestId?: string;
  }): Promise<void>;
}
