import type { Pool } from 'pg';
import type { VisitorEngagementEvent, VisitorEngagementRepository } from '../domain/visitor-engagement';

export class PostgresVisitorEngagementRepository implements VisitorEngagementRepository {
  constructor(private readonly pool: Pool) {}

  async record(event: VisitorEngagementEvent): Promise<void> {
    await this.pool.query(
      `insert into visitor_engagement_events
        (id, event_type, experience_id, destination_id, operator_id, province_code, occurred_at, source, metadata)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)`,
      [
        event.id,
        event.eventType,
        event.experienceId ?? null,
        event.destinationId ?? null,
        event.operatorId ?? null,
        event.provinceCode ?? null,
        event.occurredAt,
        event.source,
        JSON.stringify(event.metadata ?? {}),
      ],
    );
  }
}
