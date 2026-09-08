import { Pool } from 'pg';
import type { AuditEvent, Destination, Operator, OperatorStatus, Province, ProvinceCode } from '../domain/types';
import type { AuditWriter, DestinationRepository, OperatorRepository, ProvinceRepository } from '../services/contracts';

const asProvinceCode = (value: string): ProvinceCode => value as ProvinceCode;

export class PostgresOperatorRepository implements OperatorRepository {
  constructor(private readonly pool: Pool) {}
  async list(options: { provinceCode?: string; status?: string; cursor?: string; limit?: number } = {}) {
    const limit = Math.min(Math.max(options.limit ?? 50, 1), 100);
    const values: unknown[] = [];
    const where: string[] = [];
    if (options.provinceCode) { values.push(options.provinceCode); where.push(`province_code = $${values.length}`); }
    if (options.status) { values.push(options.status); where.push(`status = $${values.length}`); }
    if (options.cursor) { values.push(options.cursor); where.push(`id > $${values.length}::uuid`); }
    values.push(limit + 1);
    const result = await this.pool.query(`select id, legal_name, trading_name, province_code, status, compliance_status, created_at, updated_at from operators ${where.length ? `where ${where.join(' and ')}` : ''} order by id limit $${values.length}`, values);
    const rows = result.rows.slice(0, limit);
    return { items: rows.map(toOperator), nextCursor: result.rows.length > limit ? rows[rows.length - 1].id : undefined };
  }
  async getById(id: string) {
    const result = await this.pool.query('select id, legal_name, trading_name, province_code, status, compliance_status, created_at, updated_at from operators where id = $1', [id]);
    return result.rows[0] ? toOperator(result.rows[0]) : null;
  }
  async save(operator: Operator) {
    const result = await this.pool.query(`insert into operators (id, legal_name, trading_name, province_code, status, compliance_status, created_at, updated_at) values ($1,$2,$3,$4,$5,$6,$7,$8) returning id, legal_name, trading_name, province_code, status, compliance_status, created_at, updated_at`, [operator.id, operator.legalName, operator.tradingName ?? null, operator.provinceCode, operator.status, operator.complianceStatus, operator.createdAt, operator.updatedAt]);
    return toOperator(result.rows[0]);
  }
  async update(operator: Operator, expectedStatus?: OperatorStatus) {
    const values: unknown[] = [operator.legalName, operator.tradingName ?? null, operator.provinceCode, operator.status, operator.complianceStatus, operator.updatedAt, operator.id];
    const expected = expectedStatus ? ' and status = $8' : '';
    if (expectedStatus) values.push(expectedStatus);
    const result = await this.pool.query(`update operators set legal_name=$1, trading_name=$2, province_code=$3, status=$4, compliance_status=$5, updated_at=$6 where id=$7${expected} returning id, legal_name, trading_name, province_code, status, compliance_status, created_at, updated_at`, values);
    return result.rows[0] ? toOperator(result.rows[0]) : null;
  }
}

export class PostgresDestinationRepository implements DestinationRepository {
  constructor(private readonly pool: Pool) {}
  async list(options: { provinceCode?: string; cursor?: string; limit?: number } = {}) {
    const limit = Math.min(Math.max(options.limit ?? 50, 1), 100);
    const values: unknown[] = [];
    const where: string[] = [];
    if (options.provinceCode) { values.push(options.provinceCode); where.push(`province_code = $${values.length}`); }
    if (options.cursor) { values.push(options.cursor); where.push(`id > $${values.length}::uuid`); }
    values.push(limit + 1);
    const result = await this.pool.query(`select id,name,slug,province_code,publication_status,description,latitude,longitude from destinations ${where.length ? `where ${where.join(' and ')}` : ''} order by id limit $${values.length}`, values);
    const rows = result.rows.slice(0, limit);
    return { items: rows.map(toDestination), nextCursor: result.rows.length > limit ? rows[rows.length - 1].id : undefined };
  }
  async getById(id: string) { const result = await this.pool.query('select id,name,slug,province_code,publication_status,description,latitude,longitude from destinations where id=$1',[id]); return result.rows[0] ? toDestination(result.rows[0]) : null; }
}

export class PostgresProvinceRepository implements ProvinceRepository {
  constructor(private readonly pool: Pool) {}
  async list() { const result = await this.pool.query('select id,code,name,slug from provinces order by name'); return result.rows.map(toProvince); }
  async getByCode(code: string) { const result = await this.pool.query('select id,code,name,slug from provinces where code=$1',[code]); return result.rows[0] ? toProvince(result.rows[0]) : null; }
}

export class PostgresAuditRepository implements AuditWriter {
  constructor(private readonly pool: Pool) {}
  async record(event: { actorId?: string; action: string; targetType: string; targetId: string; outcome: 'success' | 'failure'; requestId?: string }) {
    await this.pool.query('insert into audit_events (actor_id,action,target_type,target_id,outcome,request_id) values ($1,$2,$3,$4,$5,$6)', [event.actorId ?? null,event.action,event.targetType,event.targetId,event.outcome,event.requestId ?? null]);
  }
  async listForTarget(targetType: string, targetId: string): Promise<AuditEvent[]> {
    const result = await this.pool.query('select id,actor_id,action,target_type,target_id,outcome,occurred_at,request_id from audit_events where target_type=$1 and target_id=$2 order by occurred_at desc',[targetType,targetId]);
    return result.rows.map((row) => ({ id: row.id, actorId: row.actor_id ?? undefined, action: row.action, targetType: row.target_type, targetId: row.target_id, outcome: row.outcome, occurredAt: new Date(row.occurred_at).toISOString(), requestId: row.request_id ?? undefined }));
  }
}

function toOperator(row: any): Operator { return { id: row.id, legalName: row.legal_name, tradingName: row.trading_name ?? undefined, provinceCode: asProvinceCode(row.province_code), status: row.status, complianceStatus: row.compliance_status, createdAt: new Date(row.created_at).toISOString(), updatedAt: new Date(row.updated_at).toISOString() }; }
function toDestination(row: any): Destination { return { id: row.id, name: row.name, slug: row.slug, provinceCode: asProvinceCode(row.province_code), publicationStatus: row.publication_status, description: row.description ?? undefined, latitude: row.latitude ?? undefined, longitude: row.longitude ?? undefined }; }
function toProvince(row: any): Province { return { id: row.id, code: asProvinceCode(row.code), name: row.name, slug: row.slug }; }
