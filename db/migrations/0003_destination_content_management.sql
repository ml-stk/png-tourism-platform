-- Destination/content management extensions for the governed public publication boundary.
alter table content_items add column if not exists body text;
alter table content_items add column if not exists summary text;
alter table content_items add column if not exists published_at timestamptz;
alter table content_items add column if not exists published_by uuid references users(id);
alter table content_items add column if not exists province_code text references provinces(code);
create index if not exists idx_content_publication_type on content_items(publication_status, type);
create index if not exists idx_content_province on content_items(province_code);
