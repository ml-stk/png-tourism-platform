import type { AuditEvent, Destination, Operator, Province } from '../domain/types';
import type { AiAuditEvent } from '../domain/ai';
import type { IndustryRepository } from '../domain/industry-ecosystem';
import type { AuditWriter, DestinationRepository as ServiceDestinationRepository, OperatorRepository as ServiceOperatorRepository, ProvinceRepository as ServiceProvinceRepository } from '../services/contracts';
import type { ID } from '../domain/types';
export type OperatorRepository = ServiceOperatorRepository;
export type DestinationRepository = ServiceDestinationRepository;
export type ProvinceRepository = ServiceProvinceRepository;
export interface AuditRepository extends AuditWriter { listForTarget(targetType:string,targetId:ID):Promise<AuditEvent[]>; }
export interface AiAuditRepository { record(event:AiAuditEvent & {requestId?:string}):Promise<void>; }
export interface PlatformRepositories { operators:OperatorRepository; destinations:DestinationRepository; provinces:ProvinceRepository; audit:AuditRepository; aiAudit?:AiAuditRepository; industry?:IndustryRepository; }
export type PersistedEntities={operator:Operator;destination:Destination;province:Province};
