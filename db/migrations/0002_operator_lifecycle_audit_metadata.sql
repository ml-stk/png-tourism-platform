-- Preserve regulatory reasons and notes with auditable operator lifecycle events.
alter table audit_events add column if not exists metadata jsonb;
