create table if not exists content_versions (
  id uuid primary key,
  content_id uuid not null references content_items(id) on delete cascade,
  version integer not null,
  title text not null,
  summary text,
  body text,
  media_asset_ids jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  created_by uuid not null,
  unique(content_id, version)
);
create index if not exists idx_content_versions_content on content_versions(content_id, version desc);

create table if not exists media_assets (
  id uuid primary key,
  kind text not null check (kind in ('image','video','document')),
  storage_key text not null unique,
  public_url text,
  alt_text text not null,
  caption text,
  width integer,
  height integer,
  mime_type text not null,
  byte_size bigint,
  checksum text,
  province_code text references provinces(code),
  publication_status text not null default 'draft' check (publication_status in ('draft','review','published','archived')),
  version integer not null default 1,
  updated_at timestamptz not null default now()
);
create index if not exists idx_media_assets_publication on media_assets(publication_status, province_code);
