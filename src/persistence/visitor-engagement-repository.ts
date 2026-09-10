import type { Pool } from 'pg';
import type { VisitorEngagementEvent, VisitorEngagementRepository } from '../domain/visitor-engagement';
import type { ProvinceCode } from '../domain/types';
import type { EngagementSummary } from '../domain/command-centre';

export interface VisitorEngagementAnalyticsRepository extends VisitorEngagementRepository {
  summarize(options: { since: Date; until: Date; provinceCode?: ProvinceCode }): Promise<EngagementSummary>;
  summarizeByProvince(options: { since: Date; until: Date }): Promise<Map<ProvinceCode, number>>;
}

export class PostgresVisitorEngagementRepository implements VisitorEngagementAnalyticsRepository {
  constructor(private readonly pool: Pool) {}

  async record(event: VisitorEngagementEvent): Promise<void> {
    await this.pool.query(
      `insert into visitor_engagement_events
        (id, event_type, experience_id, destination_id, operator_id, province_code, occurred_at, source, metadata)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)`,
      [event.id, event.eventType, event.experienceId ?? null, event.destinationId ?? null, event.operatorId ?? null, event.provinceCode ?? null, event.occurredAt, event.source, JSON.stringify(event.metadata ?? {})],
    );
  }

  async summarize({ since, until, provinceCode }: { since: Date; until: Date; provinceCode?: ProvinceCode }): Promise<EngagementSummary> {
    const result = await this.pool.query<{ total_signals: string; experience_views: string; saved_experiences: string; itinerary_adds: string; qr_handoffs: string }>(
      `select count(*)::text as total_signals,
        count(*) filter (where event_type = 'experience_view')::text as experience_views,
        count(*) filter (where event_type = 'experience_saved')::text as saved_experiences,
        count(*) filter (where event_type in ('experience_added_to_itinerary','destination_added_to_itinerary'))::text as itinerary_adds,
        count(*) filter (where event_type = 'qr_handoff_created')::text as qr_handoffs
       from visitor_engagement_events
       where occurred_at >= $1 and occurred_at < $2
         and ($3::text is null or province_code = $3)`,
      [since.toISOString(), until.toISOString(), provinceCode ?? null],
    );
    const row = result.rows[0];
    return { totalSignals: Number(row?.total_signals ?? 0), experienceViews: Number(row?.experience_views ?? 0), savedExperiences: Number(row?.saved_experiences ?? 0), itineraryAdds: Number(row?.itinerary_adds ?? 0), qrHandoffs: Number(row?.qr_handoffs ?? 0) };
  }

  async summarizeByProvince({ since, until }: { since: Date; until: Date }): Promise<Map<ProvinceCode, number>> {
    const result = await this.pool.query<{ province_code: ProvinceCode; signals: string }>(
      `select province_code, count(*)::text as signals
       from visitor_engagement_events
       where occurred_at >= $1 and occurred_at < $2 and province_code is not null
       group by province_code`,
      [since.toISOString(), until.toISOString()],
    );
    return new Map(result.rows.map(row => [row.province_code, Number(row.signals)]));
  }
}
