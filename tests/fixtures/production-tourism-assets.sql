create table public.tourism_attractions (
  id uuid primary key default gen_random_uuid(),
  registry_id text not null unique default ('ATT-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))),
  name text not null,
  description text,
  attraction_type text not null,
  province_id uuid references public.provinces(id),
  destination_id uuid references public.destinations(id),
  operator_id uuid references public.operators(id),
  latitude numeric(9,6),
  longitude numeric(9,6),
  status text not null default 'draft' check (status in ('draft','submitted','published','suspended')),
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tourism_products (
  id uuid primary key default gen_random_uuid(),
  registry_id text not null unique default ('PRD-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))),
  operator_id uuid not null references public.operators(id),
  name text not null,
  description text,
  product_type text not null,
  province_id uuid references public.provinces(id),
  destination_id uuid references public.destinations(id),
  status text not null default 'draft' check (status in ('draft','submitted','published','suspended')),
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tourism_services (
  id uuid primary key default gen_random_uuid(),
  registry_id text not null unique default ('SRV-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))),
  operator_id uuid not null references public.operators(id),
  name text not null,
  description text,
  service_type text not null,
  province_id uuid references public.provinces(id),
  destination_id uuid references public.destinations(id),
  status text not null default 'draft' check (status in ('draft','submitted','published','suspended')),
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tourism_attractions enable row level security;
alter table public.tourism_products enable row level security;
alter table public.tourism_services enable row level security;

