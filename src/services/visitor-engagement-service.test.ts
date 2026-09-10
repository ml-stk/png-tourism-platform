import { describe, expect, it } from 'vitest';
import { VisitorEngagementService } from './visitor-engagement-service';
import type { VisitorEngagementEvent } from '../domain/visitor-engagement';

describe('VisitorEngagementService', () => {
  it('records only supported visitor events', async () => {
    const events: VisitorEngagementEvent[] = [];
    const service = new VisitorEngagementService({ record: async event => { events.push(event); } });
    await service.record({ eventType: 'experience_added_to_itinerary', source: 'web', experienceId: 'exp-1', provinceCode: 'NCD', metadata: { surface: 'trip-planner' } });
    expect(events).toHaveLength(1);
    expect(events[0].id).toBeTruthy();
    expect(events[0].occurredAt).toBeTruthy();
  });

  it('rejects unsupported events', async () => {
    const service = new VisitorEngagementService({ record: async () => undefined });
    await expect(service.record({ eventType: 'not-real' as never, source: 'web' })).rejects.toThrow('Unsupported engagement event');
  });
});
