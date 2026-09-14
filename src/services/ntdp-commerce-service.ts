import type { Pool } from 'pg';

export type CommerceStatus = 'initiated' | 'pending' | 'authorised' | 'settled' | 'failed' | 'refunded' | 'cancelled';

export class NtdpCommerceService {
  constructor(private readonly pool: Pool) {}

  async listTransactions(input: { status?: string; providerCode?: string; operatorId?: string; limit?: number } = {}) {
    const clauses: string[] = [];
    const params: unknown[] = [];
    if (input.status) { params.push(input.status); clauses.push(`t.status=$${params.length}`); }
    if (input.providerCode) { params.push(input.providerCode); clauses.push(`p.code=$${params.length}`); }
    if (input.operatorId) { params.push(input.operatorId); clauses.push(`t.operator_id=$${params.length}`); }
    const limit = Math.min(Math.max(input.limit ?? 50, 1), 200);
    params.push(limit);
    const r = await this.pool.query(`select t.*,p.code provider_code,p.name provider_name from commerce.transactions t left join commerce.payment_providers p on p.id=t.provider_id ${clauses.length ? 'where ' + clauses.join(' and ') : ''} order by t.created_at desc limit $${params.length}`, params);
    return r.rows;
  }

  async getTransaction(id: string) {
    const r = await this.pool.query(`select t.*,p.code provider_code,p.name provider_name from commerce.transactions t left join commerce.payment_providers p on p.id=t.provider_id where t.id=$1`, [id]);
    return r.rows[0] ?? null;
  }

  async transitionTransaction(input: { transactionId: string; status: CommerceStatus; changedBy: string; externalReference?: string; reason?: string; metadata?: Record<string, unknown> }) {
    const current = await this.pool.query(`select status from commerce.transactions where id=$1`, [input.transactionId]);
    if (!current.rows[0]) return null;
    const from = current.rows[0].status as CommerceStatus;
    const allowed: Record<CommerceStatus, CommerceStatus[]> = {
      initiated: ['pending', 'cancelled'],
      pending: ['authorised', 'failed', 'cancelled'],
      authorised: ['settled', 'failed', 'cancelled'],
      settled: ['refunded'],
      failed: ['initiated', 'cancelled'],
      refunded: [],
      cancelled: []
    };
    if (from !== input.status && !allowed[from].includes(input.status)) {
      throw Object.assign(new Error(`Transaction cannot transition from ${from} to ${input.status}`), { code: 'VALIDATION_ERROR' });
    }
    const r = await this.pool.query(`update commerce.transactions set status=$2,external_reference=coalesce($3,external_reference),metadata=metadata || $4::jsonb,updated_at=now() where id=$1 returning *`, [input.transactionId, input.status, input.externalReference ?? null, JSON.stringify(input.metadata ?? {})]);
    if (r.rows[0] && from !== input.status) await this.pool.query(`insert into commerce.transaction_events(transaction_id,from_status,to_status,changed_by,reason,metadata) values($1,$2,$3,$4,$5,$6)`, [input.transactionId, from, input.status, input.changedBy, input.reason ?? null, JSON.stringify(input.metadata ?? {})]);
    return r.rows[0] ?? null;
  }

  async transactionEvents(transactionId: string) {
    const r = await this.pool.query(`select * from commerce.transaction_events where transaction_id=$1 order by changed_at desc`, [transactionId]);
    return r.rows;
  }

  async providerReadiness() {
    const r = await this.pool.query(`select code,name,status,capabilities,configuration_ref,created_at from commerce.payment_providers order by name`);
    return { providers: r.rows, credentialStorage: 'external-secret-manager', transactionModel: 'commerce.transactions', lifecycleAudit: 'commerce.transaction_events' };
  }
}
