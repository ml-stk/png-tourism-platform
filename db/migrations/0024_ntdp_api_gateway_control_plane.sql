create schema if not exists gateway;

create table if not exists gateway.api_clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  organisation text,
  contact_email text,
  client_type text not null default 'third_party' check (client_type in ('internal','provincial','third_party')),
  status text not null default 'pending' check (status in ('pending','approved','suspended','revoked')),
  rate_limit_per_minute integer not null default 60 check (rate_limit_per_minute > 0),
  allowed_scopes jsonb not null default '[]'::jsonb,
  created_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists gateway.api_keys (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references gateway.api_clients(id) on delete cascade,
  key_prefix text not null,
  key_hash text not null unique,
  label text,
  status text not null default 'active' check (status in ('active','revoked')),
  expires_at timestamptz,
  last_used_at timestamptz,
  created_by uuid references users(id),
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);
create index if not exists idx_gateway_api_keys_client on gateway.api_keys(client_id,status);

create table if not exists gateway.routes (
  id uuid primary key default gen_random_uuid(),
  route_key text not null unique,
  method text not null check (method in ('GET','POST','PATCH','PUT','DELETE')),
  path_pattern text not null,
  description text,
  visibility text not null default 'approved_partner' check (visibility in ('internal','public','approved_partner')),
  required_scope text,
  upstream_service text not null,
  status text not null default 'active' check (status in ('active','deprecated','disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_gateway_routes_status on gateway.routes(status,visibility);

create table if not exists gateway.request_log (
  id bigserial primary key,
  request_id text not null,
  client_id uuid references gateway.api_clients(id),
  api_key_id uuid references gateway.api_keys(id),
  method text not null,
  route_key text,
  path text not null,
  status_code integer not null,
  latency_ms integer,
  requested_at timestamptz not null default now()
);
create index if not exists idx_gateway_request_log_client_time on gateway.request_log(client_id,requested_at desc);
create index if not exists idx_gateway_request_log_route_time on gateway.request_log(route_key,requested_at desc);

insert into gateway.routes(route_key,method,path_pattern,description,visibility,required_scope,upstream_service) values
 ('public-destinations','GET','/api/v1/public/destinations','Published tourism destinations','public',null,'visitor'),
 ('public-content','GET','/api/v1/public/content','Published tourism content','public',null,'visitor'),
 ('public-operators','GET','/api/v1/public/operators','Published operator directory','public',null,'registry'),
 ('public-offline-manifest','GET','/api/v1/public/offline/manifest','Provincial and kiosk offline manifests','public',null,'distribution'),
 ('public-qr-resolve','GET','/api/v1/public/qr/resolve','Public QR handoff resolution','public',null,'distribution'),
 ('partner-destinations','GET','/api/v1/public/destinations','Approved partner destination feed','approved_partner','destinations:read','visitor'),
 ('partner-content','GET','/api/v1/public/content','Approved partner content feed','approved_partner','content:read','visitor')
on conflict (route_key) do nothing;

insert into permissions(code,description) values
 ('gateway:read','Read API gateway clients, routes and usage'),
 ('gateway:write','Manage API gateway clients, keys and routes')
on conflict (code) do nothing;

insert into role_permissions(role_id,permission_id)
select r.id,p.id from roles r cross join permissions p
where r.code='platform_admin' and p.code in ('gateway:read','gateway:write')
on conflict do nothing;

insert into role_permissions(role_id,permission_id)
select r.id,p.id from roles r cross join permissions p
where r.code='tpa_regulator' and p.code='gateway:read'
on conflict do nothing;
