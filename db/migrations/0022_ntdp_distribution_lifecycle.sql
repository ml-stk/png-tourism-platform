alter table distribution.publications
  add column if not exists status text not null default 'queued'
    check (status in ('queued','published','failed','cancelled')),
  add column if not exists published_at timestamptz,
  add column if not exists attempts integer not null default 0,
  add column if not exists last_error text,
  add column if not exists updated_at timestamptz not null default now();

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
begin
  update distribution.publications
  set status='published', published_at=coalesce(published_at, now()), updated_at=now(), last_error=null
  where id=p_publication_id and status in ('queued','failed')
  returning * into result_row;
  if result_row.id is null then return null; end if;
  return result_row;
end;
$$;
