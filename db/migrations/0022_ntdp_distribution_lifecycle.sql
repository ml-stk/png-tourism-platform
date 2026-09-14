-- distribution.publications already has status, published_at, last_error,
-- metadata, created_at and updated_at in migration 0016. This migration adds
-- delivery-attempt tracking and auditable lifecycle events without redefining
-- existing columns.
alter table distribution.publications
  add column if not exists attempts integer not null default 0;

create index if not exists idx_distribution_publications_status
  on distribution.publications(status, created_at desc);

create table if not exists distribution.publication_events (
  id uuid primary key default gen_random_uuid(),
  publication_id uuid not null references distribution.publications(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by uuid references users(id),
  message text,
  changed_at timestamptz not null default now()
);
create index if not exists idx_distribution_publication_events
  on distribution.publication_events(publication_id, changed_at desc);

create table if not exists distribution.partner_events (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references distribution.partners(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by uuid references users(id),
  reason text,
  changed_at timestamptz not null default now()
);
create index if not exists idx_distribution_partner_events
  on distribution.partner_events(partner_id, changed_at desc);

create or replace function distribution_mark_publication_published(p_publication_id uuid, p_changed_by uuid default null)
returns distribution.publications
language plpgsql
as $$
declare result_row distribution.publications;
  previous_status text;
begin
  select status into previous_status from distribution.publications where id=p_publication_id for update;
  if previous_status is null then return null; end if;
  update distribution.publications
  set status='published', published_at=coalesce(published_at, now()), updated_at=now(), last_error=null,
      attempts=attempts+1
  where id=p_publication_id and status in ('queued','failed')
  returning * into result_row;
  if result_row.id is null then return null; end if;
  insert into distribution.publication_events(publication_id,from_status,to_status,changed_by,message)
  values(p_publication_id,previous_status,'published',p_changed_by,'Publication delivered');
  return result_row;
end;
$$;
