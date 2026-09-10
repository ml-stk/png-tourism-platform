import { randomUUID } from 'node:crypto';
import type { VisitorEngagementEvent, VisitorEngagementEventType, VisitorEngagementRepository, VisitorEngagementSource } from '../domain/visitor-engagement';

const allowedTypes = new Set<VisitorEngagementEventType>([
  'experience_view',
  'experience_saved',
  'experience_added_to_itinerary',
  'destination_added_to_itinerary',
  'qr_handoff_created',
]);

export class VisitorEngagementService {
  constructor(private readonly repository: VisitorEngagementRepository) {}

  async record(input: Omit<VisitorEngagementEvent, 'id' | 'occurredAt'> & { eventType: VisitorEngagementEventType }): Promise<void> {
    if (!allowedTypes.has(input.eventType)) throw new Error('Unsupported engagement event');
    await this.repository.record({ ...input, id: randomUUID(), occurredAt: new Date().toISOString() });
  }
}

export function isVisitorEngagementSource(value: unknown): value is VisitorEngagementSource {
  return value === 'web' || value === 'mobile' || value === 'kiosk' || value === 'qr';
}
