import type { AuditEvent, Destination, Operator, Province } from '../domain/types';
import type {
  AuditWriter,
  DestinationRepository as ServiceDestinationRepository,
  OperatorRepository as ServiceOperatorRepository,
  ProvinceRepository as ServiceProvinceRepository,
} from '../services/contracts';
import type { ID } from '../domain/types';

/** Persistence contracts intentionally preserve the service-layer boundary. */
export type OperatorRepository = ServiceOperatorRepository;
export type DestinationRepository = ServiceDestinationRepository;
export type ProvinceRepository = ServiceProvinceRepository;

export interface AuditRepository extends AuditWriter {
  listForTarget(targetType: string, targetId: ID): Promise<AuditEvent[]>;
}

export interface PlatformRepositories {
  operators: OperatorRepository;
  destinations: DestinationRepository;
  provinces: ProvinceRepository;
  audit: AuditRepository;
}

/** Compile-time helper for adapters that persist domain entities. */
export type PersistedEntities = {
  operator: Operator;
  destination: Destination;
  province: Province;
};
