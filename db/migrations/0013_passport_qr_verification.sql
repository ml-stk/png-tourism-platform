alter table visitor_engagement_events drop constraint if exists visitor_engagement_events_event_type_check;
alter table visitor_engagement_events add constraint visitor_engagement_events_event_type_check check (event_type in ('experience_view','experience_saved','experience_added_to_itinerary','destination_added_to_itinerary','qr_handoff_created','destination_visit_verified'));
create index if not exists visitor_engagement_destination_verification_idx on visitor_engagement_events (destination_id, event_type, occurred_at);
