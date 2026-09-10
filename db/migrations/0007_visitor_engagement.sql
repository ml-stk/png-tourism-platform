create table if not exists visitor_engagement_events (
  id uuid primary key,
  event_type text not null check (event_type in ('experience_view','experience_saved','experience_added_to_itinerary','destination_added_to_itinerary','qr_handoff_created')),
  experience_id uuid null,
  destination_id uuid null,
  operator_id uuid null,
  province_code text null,
  occurred_at timestamptz not null,
  source text not null check (source in ('web','mobile','kiosk','qr')),
  metadata jsonb not null default '{}'::jsonb
);
create index if not exists visitor_engagement_occurred_at_idx on visitor_engagement_events (occurred_at);
create index if not exists visitor_engagement_province_idx on visitor_engagement_events (province_code, occurred_at);
create index if not exists visitor_engagement_experience_idx on visitor_engagement_events (experience_id, occurred_at);
