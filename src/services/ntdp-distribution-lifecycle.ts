import type { Pool } from 'pg';

export class NtdpDistributionLifecycleService {
  constructor(private readonly pool: Pool) {}

  async listPublications(channelCode?: string, status?: string) {
    const clauses: string[] = [];
    const params: unknown[] = [];
    if (channelCode) { params.push(channelCode); clauses.push(`c.code=$${params.length}`); }
    if (status) { params.push(status); clauses.push(`p.status=$${params.length}`); }
    const r = await this.pool.query(`select p.*,c.code channel_code,c.name channel_name,c.channel_type,c.status channel_status from distribution.publications p join distribution.channels c on c.id=p.channel_id ${clauses.length ? 'where ' + clauses.join(' and ') : ''} order by p.created_at desc`, params);
    return r.rows;
  }

  async transitionPublication(input: { publicationId: string; status: 'published'|'failed'|'cancelled'; changedBy: string; message?: string }) {
    const current = await this.pool.query(`select status from distribution.publications where id=$1`, [input.publicationId]);
    if (!current.rows[0]) return null;
    const from = current.rows[0].status;
    const allowed: Record<string, string[]> = { queued: ['published','failed','cancelled'], failed: ['published','cancelled'] };
    if (input.status !== 'published' && !(allowed[from] || []).includes(input.status)) {
      throw Object.assign(new Error(`Publication cannot transition from ${from} to ${input.status}`), { code: 'VALIDATION_ERROR' });
    }
    const r = await this.pool.query(`update distribution.publications set status=$2,published_at=case when $2='published' then coalesce(published_at,now()) else published_at end,attempts=attempts+1,last_error=case when $2='failed' then $3 else null end,updated_at=now() where id=$1 returning *`, [input.publicationId, input.status, input.message ?? null]);
    if (r.rows[0] && from !== input.status) await this.pool.query(`insert into distribution.publication_events(publication_id,from_status,to_status,changed_by,message) values($1,$2,$3,$4,$5)`, [input.publicationId, from, input.status, input.changedBy, input.message ?? null]);
    return r.rows[0] ?? null;
  }

  async publicationEvents(publicationId: string) {
    const r = await this.pool.query(`select * from distribution.publication_events where publication_id=$1 order by changed_at desc`, [publicationId]);
    return r.rows;
  }

  async transitionPartner(input: { partnerId: string; status: 'approved'|'suspended'|'revoked'|'pending'; changedBy: string; reason?: string }) {
    const current = await this.pool.query(`select status from distribution.partners where id=$1`, [input.partnerId]);
    if (!current.rows[0]) return null;
    const from = current.rows[0].status;
    const r = await this.pool.query(`update distribution.partners set status=$2,approved_by=case when $2='approved' then $3 else approved_by end,approved_at=case when $2='approved' then coalesce(approved_at,now()) else approved_at end,updated_at=now() where id=$1 returning *`, [input.partnerId, input.status, input.changedBy]);
    if (r.rows[0] && from !== input.status) await this.pool.query(`insert into distribution.partner_events(partner_id,from_status,to_status,changed_by,reason) values($1,$2,$3,$4,$5)`, [input.partnerId, from, input.status, input.changedBy, input.reason ?? null]);
    return r.rows[0] ?? null;
  }

  async partnerEvents(partnerId: string) {
    const r = await this.pool.query(`select * from distribution.partner_events where partner_id=$1 order by changed_at desc`, [partnerId]);
    return r.rows;
  }
}
