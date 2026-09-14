create table if not exists regulatory_licenses (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references operators(id) on delete cascade,
  license_number text unique,
  license_type text not null default 'tourism_operator',
  status text not null default 'applied' check (status in ('applied','under_review','approved','suspended','expired','revoked')),
  applied_at timestamptz not null default now(),
  approved_at timestamptz,
  expires_at timestamptz,
  conditions jsonb not null default '{}'::jsonb,
  documents jsonb not null default '[]'::jsonb,
  reviewed_by uuid references users(id),
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_regulatory_licenses_operator on regulatory_licenses(operator_id);
create index if not exists idx_regulatory_licenses_status on regulatory_licenses(status);

create table if not exists regulatory_inspections (
  id uuid primary key default gen_random_uuid(),
  license_id uuid not null references regulatory_licenses(id) on delete cascade,
  operator_id uuid not null references operators(id) on delete cascade,
  inspection_date date not null default current_date,
  inspector_id uuid references users(id),
  outcome text not null default 'pending' check (outcome in ('pending','passed','conditional','failed')),
  findings jsonb not null default '{}'::jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  next_due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_regulatory_inspections_license on regulatory_inspections(license_id, inspection_date desc);

create table if not exists regulatory_compliance_actions (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references operators(id) on delete cascade,
  license_id uuid references regulatory_licenses(id) on delete set null,
  inspection_id uuid references regulatory_inspections(id) on delete set null,
  action_type text not null,
  status text not null default 'open' check (status in ('open','in_progress','completed','overdue','cancelled')),
  due_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_regulatory_actions_operator on regulatory_compliance_actions(operator_id, status);

create table if not exists distribution.partners (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  partner_type text not null default 'third_party',
  status text not null default 'pending' check (status in ('pending','approved','suspended','revoked')),
  endpoint_url text,
  capabilities jsonb not null default '{}'::jsonb,
  approved_by uuid references users(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists distribution.partner_channel_bindings (
  partner_id uuid not null references distribution.partners(id) on delete cascade,
  channel_id uuid not null references distribution.channels(id) on delete cascade,
  status text not null default 'active' check (status in ('active','paused','revoked')),
  created_at timestamptz not null default now(),
  primary key (partner_id, channel_id)
);
create index if not exists idx_distribution_partner_status on distribution.partners(status);
