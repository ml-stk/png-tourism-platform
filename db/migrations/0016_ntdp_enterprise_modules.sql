-- NTDP Concept Note compliance baseline: enterprise modules not yet represented as first-class persistence domains.
create extension if not exists postgis;
create schema if not exists analytics;
create schema if not exists gis;
create schema if not exists commerce;
create schema if not exists distribution;

create table if not exists analytics.operator_snapshot (
  snapshot_date date not null,
  operator_id uuid not null references operators(id),
  province_code text not null references provinces(code),
  status text not null,
  compliance_status text not null,
  primary key (snapshot_date, operator_id)
);
create table if not exists analytics.visitor_event_fact (
  event_id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null,
  source text not null,
  province_code text references provinces(code),
  operator_id uuid references operators(id),
  destination_id uuid references destinations(id),
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb
);
create table if not exists analytics.daily_metric_fact (
  metric_date date not null,
  metric_code text not null,
  province_code text references provinces(code),
  metric_value numeric not null,
  source text not null,
  created_at timestamptz not null default now()
);
create unique index if not exists uq_analytics_daily_metric on analytics.daily_metric_fact(metric_date, metric_code, coalesce(province_code, '__NATIONAL__'));
create index if not exists idx_analytics_events_time on analytics.visitor_event_fact(occurred_at desc);
create index if not exists idx_analytics_events_province on analytics.visitor_event_fact(province_code, occurred_at desc);
create index if not exists idx_analytics_operator_snapshot_date on analytics.operator_snapshot(snapshot_date desc);

create table if not exists gis.tourism_geo_asset (
  id uuid primary key default gen_random_uuid(),
  asset_type text not null check (asset_type in ('operator','destination','attraction','infrastructure','service','event')),
  source_id uuid not null,
  name text not null,
  province_code text references provinces(code),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  location geography(Point,4326) generated always as (st_setsrid(st_makepoint(longitude, latitude),4326)::geography) stored,
  properties jsonb not null default '{}'::jsonb,
  is_public boolean not null default false,
  updated_at timestamptz not null default now(),
  unique(asset_type, source_id)
);
create index if not exists idx_gis_tourism_geo_asset_location on gis.tourism_geo_asset using gist(location);
create index if not exists idx_gis_tourism_geo_asset_province on gis.tourism_geo_asset(province_code);

create table if not exists sme_profiles (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null unique references operators(id) on delete cascade,
  business_size text not null check (business_size in ('micro','small','medium','large','unknown')) default 'unknown',
  ownership_type text,
  development_status text not null check (development_status in ('not_assessed','assessed','in_program','graduated')) default 'not_assessed',
  needs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists sme_assessments (
  id uuid primary key default gen_random_uuid(),
  sme_id uuid not null references sme_profiles(id) on delete cascade,
  assessed_at timestamptz not null default now(),
  assessor_id uuid references users(id),
  score numeric(5,2) check (score between 0 and 100),
  findings jsonb not null default '{}'::jsonb,
  recommended_actions jsonb not null default '[]'::jsonb,
  status text not null check (status in ('draft','final')) default 'draft'
);
create table if not exists sme_development_programs (
  id uuid primary key default gen_random_uuid(), name text not null, description text, provider text,
  start_date date, end_date date, status text not null check (status in ('planned','open','closed','completed')) default 'planned'
);
create table if not exists sme_program_enrolments (
  id uuid primary key default gen_random_uuid(),
  sme_id uuid not null references sme_profiles(id) on delete cascade,
  program_id uuid not null references sme_development_programs(id) on delete cascade,
  status text not null check (status in ('applied','accepted','active','completed','withdrawn')) default 'applied',
  enrolled_at timestamptz not null default now(), completed_at timestamptz,
  unique(sme_id, program_id)
);

create table if not exists tia_memberships (
  id uuid primary key default gen_random_uuid(), operator_id uuid not null references operators(id) on delete cascade,
  membership_number text unique, status text not null check (status in ('applied','active','expired','suspended','cancelled')) default 'applied',
  applied_at timestamptz not null default now(), approved_at timestamptz, expires_at date,
  fee_amount numeric(12,2), fee_currency char(3) default 'PGK', renewal_of uuid references tia_memberships(id), notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists idx_tia_memberships_operator on tia_memberships(operator_id);
create index if not exists idx_tia_memberships_expiry on tia_memberships(expires_at);

create table if not exists distribution.channels (
  id uuid primary key default gen_random_uuid(), code text not null unique, name text not null,
  channel_type text not null check (channel_type in ('website','super_app','provincial_portal','kiosk','third_party')),
  status text not null check (status in ('draft','active','suspended')) default 'draft', endpoint_url text,
  requires_authentication boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists distribution.publications (
  id uuid primary key default gen_random_uuid(), channel_id uuid not null references distribution.channels(id) on delete cascade,
  content_id uuid references content_items(id) on delete cascade, destination_id uuid references destinations(id) on delete cascade,
  status text not null check (status in ('queued','published','failed','withdrawn')) default 'queued', published_at timestamptz,
  last_error text, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check ((content_id is not null) or (destination_id is not null))
);
create unique index if not exists uq_distribution_publication_content on distribution.publications(channel_id, content_id) where content_id is not null;
create unique index if not exists uq_distribution_publication_destination on distribution.publications(channel_id, destination_id) where destination_id is not null;

create table if not exists commerce.payment_providers (
  id uuid primary key default gen_random_uuid(), code text not null unique, name text not null,
  status text not null check (status in ('planned','sandbox','active','disabled')) default 'planned',
  capabilities jsonb not null default '[]'::jsonb, configuration_ref text, created_at timestamptz not null default now()
);
create table if not exists commerce.transactions (
  id uuid primary key default gen_random_uuid(), provider_id uuid references commerce.payment_providers(id), operator_id uuid references operators(id),
  external_reference text, transaction_type text not null check (transaction_type in ('membership_fee','application_fee','booking','other')),
  amount numeric(12,2) not null check (amount >= 0), currency char(3) not null default 'PGK',
  status text not null check (status in ('initiated','pending','authorised','settled','failed','refunded','cancelled')) default 'initiated',
  idempotency_key text unique, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists idx_commerce_transactions_status on commerce.transactions(status, created_at desc);

insert into distribution.channels(code,name,channel_type,status,requires_authentication) values
 ('png-tourism-website','PNG Tourism Website','website','active',false),('png-tourism-super-app','PNG Tourism Super App','super_app','draft',true),
 ('provincial-portals','Provincial Tourism Portals','provincial_portal','active',true),('tourism-kiosks','Tourism Information Kiosks','kiosk','active',true),
 ('approved-third-party','Approved Third-Party Platforms','third_party','draft',true) on conflict (code) do nothing;
insert into commerce.payment_providers(code,name,status,capabilities) values
 ('platform-ready','NTDP Commerce Readiness','planned','["membership_fee","application_fee","booking","refund"]'::jsonb) on conflict (code) do nothing;

insert into permissions (code, description) values
 ('gis:read','Read governed tourism geospatial assets'),('gis:write','Create and update tourism geospatial assets'),('sme:read','Read SME development records'),('sme:write','Create and update SME development records'),
 ('membership:read','Read TIA membership records'),('membership:write','Create and manage TIA membership applications'),('distribution:read','Read distribution channel and publication records'),('distribution:write','Queue approved tourism content for distribution'),
 ('commerce:read','Read commerce readiness and transaction status'),('commerce:write','Create governed commerce transactions'),('warehouse:read','Read analytical warehouse metrics'),('warehouse:write','Run governed analytical snapshots') on conflict (code) do nothing;
insert into role_permissions (role_id, permission_id) select r.id,p.id from roles r join permissions p on p.code in ('gis:read','sme:read','membership:read','distribution:read','commerce:read','warehouse:read') where r.code in ('platform_admin','analyst') on conflict do nothing;
insert into role_permissions (role_id, permission_id) select r.id,p.id from roles r join permissions p on p.code in ('gis:read','gis:write','sme:read','sme:write','distribution:read','distribution:write') where r.code='provincial_admin' on conflict do nothing;
insert into role_permissions (role_id, permission_id) select r.id,p.id from roles r join permissions p on p.code in ('membership:read','membership:write','commerce:read','commerce:write','warehouse:read','warehouse:write','gis:read','gis:write','distribution:read','distribution:write') where r.code='tpa_regulator' on conflict do nothing;
insert into role_permissions (role_id, permission_id) select r.id,p.id from roles r join permissions p on p.code in ('sme:read','sme:write','membership:read','distribution:read','commerce:read','gis:read') where r.code='operator' on conflict do nothing;
