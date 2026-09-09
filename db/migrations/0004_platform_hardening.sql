-- Platform hardening: make publication provenance and offline sync metadata explicit.
alter table destinations add column if not exists content_version integer not null default 1;
alter table content_items add column if not exists body text;
alter table content_items add column if not exists summary text;
alter table content_items add column if not exists published_at timestamptz;
alter table content_items add column if not exists published_by uuid references users(id);
alter table content_items add column if not exists province_code text references provinces(code);

create index if not exists idx_destinations_province_publication on destinations(province_code, publication_status);
create index if not exists idx_content_province_publication on content_items(province_code, publication_status);

-- Existing published records retain an explicit publication timestamp when none exists.
update content_items set published_at = updated_at
where publication_status = 'published' and published_at is null;
