import type { AuditEvent, Destination, Operator, Province } from '../domain/types';
import type { ID } from '../domain/types';

export interface OperatorRepository {
  getById(id: ID): Promise<Operator | undefined>;
  create(operator: Operator): Promise<Operator>;
  update(operator: Operator): Promise<Operator>;
}

export interface DestinationRepository {
  getById(id: ID): Promise<Destination | undefined>;
  listPublished(): Promise<Destination[]>;
  create(destination: Destination): Promise<Destination>;
  update(destination: Destination): Promise<Destination>;
}

export interface ProvinceRepository {
  getByCode(code: Province['code']): Promise<Province | undefined>;
  list(): Promise<Province[]>;
}

export interface AuditRepository {
  append(event: AuditEvent): Promise<void>;
  listForTarget(targetType: string, targetId: ID): Promise<AuditEvent[]>;
}

export interface PlatformRepositories {
  operators: OperatorRepository;
  destinations: DestinationRepository;
  provinces: ProvinceRepository;
  audit: AuditRepository;
}
