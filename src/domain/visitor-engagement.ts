export type VisitorEngagementEventType =
  | 'experience_view'
  | 'experience_saved'
  | 'experience_added_to_itinerary'
  | 'destination_added_to_itinerary'
  | 'qr_handoff_created'
  | 'destination_visit_verified';

export type VisitorEngagementSource = 'web' | 'mobile' | 'kiosk' | 'qr';

export interface VisitorEngagementEvent {
  id: string;
  eventType: VisitorEngagementEventType;
  experienceId?: string;
  destinationId?: string;
  operatorId?: string;
  provinceCode?: string;
  occurredAt: string;
  source: VisitorEngagementSource;
  metadata?: Record<string, string | number | boolean>;
}

export interface VisitorEngagementRepository {
  record(event: VisitorEngagementEvent): Promise<void>;
}
