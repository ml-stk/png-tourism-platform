-- PNG Tourism Platform - PostgreSQL foundation
-- Designed for PostgreSQL/Supabase-compatible deployments.

create extension if not exists pgcrypto;

create type operator_status as enum ('draft','pending_review','active','suspended','closed');
create type compliance_status as enum ('unknown','compliant','conditional','non_compliant');
create type publication_status as enum ('draft','review','published','archived');

create table provinces (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table operators (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  trading_name text,
  province_code text not null references provinces(code),
  status operator_status not null default 'draft',
  compliance_status compliance_status not null default 'unknown',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table users (
  id uuid primary key default gen_random_uuid(),
  external_subject text not null unique,
  email text not null unique,
  display_name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table roles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text not null
);

create table permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text not null
);

create table role_permissions (
  role_id uuid not null references roles(id) on delete cascade,
  permission_id uuid not null references permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table user_roles (
  user_id uuid not null references users(id) on delete cascade,
  role_id uuid not null references roles(id) on delete cascade,
  province_code text references provinces(code),
  operator_id uuid references operators(id),
  primary key (user_id, role_id, province_code, operator_id)
);

create table destinations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  province_code text not null references provinces(code),
  publication_status publication_status not null default 'draft',
  description text,
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table content_items (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  title text not null,
  slug text not null unique,
  publication_status publication_status not null default 'draft',
  version integer not null default 1,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references users(id),
  action text not null,
  target_type text not null,
  target_id uuid not null,
  outcome text not null check (outcome in ('success','failure')),
  occurred_at timestamptz not null default now(),
  request_id text
);

create index idx_operators_province on operators(province_code);
create index idx_operators_status on operators(status);
create index idx_destinations_publication on destinations(publication_status);
create index idx_destinations_province on destinations(province_code);
create index idx_audit_target on audit_events(target_type, target_id, occurred_at desc);
create index idx_audit_actor on audit_events(actor_id, occurred_at desc);

insert into roles (code, name, description) values
  ('platform_admin','Platform Administrator','Full platform administration and configuration'),
  ('tpa_regulator','TPA Regulatory Officer','Regulatory operator lifecycle and compliance'),
  ('content_manager','Content Manager','Destination and tourism content management'),
  ('provincial_admin','Provincial Administrator','Province-scoped tourism administration'),
  ('operator','Tourism Operator','Own operator profile and permitted self-service actions'),
  ('analyst','Tourism Analyst','Read-only intelligence and reporting access')
on conflict (code) do nothing;

insert into permissions (code, description) values
  ('operator:read','Read operator records'),
  ('operator:register','Register tourism operators'),
  ('operator:approve','Approve or reject operator registrations'),
  ('operator:manage_compliance','Manage operator compliance'),
  ('content:read','Read tourism content'),
  ('content:write','Create and edit tourism content'),
  ('content:publish','Publish tourism content'),
  ('intelligence:read','Read tourism intelligence'),
  ('admin:manage_users','Manage platform users and roles'),
  ('audit:read','Read audit events')
on conflict (code) do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r cross join permissions p
where r.code = 'platform_admin'
on conflict do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p on p.code in (
  'operator:read','operator:register','operator:approve','operator:manage_compliance','audit:read'
) where r.code = 'tpa_regulator'
on conflict do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p on p.code in (
  'content:read','content:write','content:publish'
) where r.code = 'content_manager'
on conflict do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p on p.code in (
  'operator:read','content:read','content:write','intelligence:read'
) where r.code = 'provincial_admin'
on conflict do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p on p.code in (
  'operator:read'
) where r.code = 'operator'
on conflict do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p on p.code in (
  'content:read','intelligence:read'
) where r.code = 'analyst'
on conflict do nothing;

-- Public-facing reads must be mediated by application services; do not expose
-- regulatory tables directly to anonymous clients.
