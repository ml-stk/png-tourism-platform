create table if not exists industry_profiles (
  id uuid primary key,
  operator_id uuid not null unique references operators(id),
  display_name text not null,
  description text not null,
  province_code text not null references provinces(code),
  categories text[] not null default '{}',
  website text,
  public_email text,
  public_phone text,
  published boolean not null default false,
  version integer not null default 1,
  updated_at timestamptz not null
);

create table if not exists industry_experiences (
  id uuid primary key,
  operator_id uuid not null references operators(id),
  title text not null,
  summary text not null,
  destination_id uuid references destinations(id),
  province_code text not null references provinces(code),
  status text not null check (status in ('draft','submitted','published','suspended')),
  version integer not null default 1,
  updated_at timestamptz not null
);

create table if not exists visitor_leads (
  id uuid primary key,
  operator_id uuid not null references operators(id),
  experience_id uuid references industry_experiences(id),
  source text not null check (source in ('visitor','qr','referral')),
  status text not null check (status in ('new','contacted','qualified','closed','declined')),
  visitor_message text,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create index if not exists idx_industry_profiles_public on industry_profiles(province_code, published);
create index if not exists idx_industry_experiences_public on industry_experiences(province_code, status);
create index if not exists idx_visitor_leads_operator on visitor_leads(operator_id, created_at desc);
