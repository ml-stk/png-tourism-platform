alter table distribution.publications drop constraint if exists publications_status_check;
alter table distribution.publications add constraint publications_status_check check (status in ('queued','published','failed','withdrawn','cancelled'));
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
