create table if not exists destination_media (
  destination_id uuid not null references destinations(id) on delete cascade,
  media_asset_id uuid not null references media_assets(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key(destination_id, media_asset_id)
);
create index if not exists idx_destination_media_order on destination_media(destination_id, sort_order);
create table if not exists destination_content_links (
  destination_id uuid not null references destinations(id) on delete cascade,
  content_id uuid not null references content_items(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(destination_id, content_id)
);
create index if not exists idx_destination_content_destination on destination_content_links(destination_id);
