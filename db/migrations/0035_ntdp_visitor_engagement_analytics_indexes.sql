-- NTDP visitor engagement analytics indexes
-- Supports common destination/province/time aggregation paths without indexing demo metadata.

create index if not exists visitor_engagement_destination_idx on public.visitor_engagement_events(destination_id, occurred_at);
create index if not exists visitor_engagement_province_destination_idx on public.visitor_engagement_events(province_code, destination_id, occurred_at);
