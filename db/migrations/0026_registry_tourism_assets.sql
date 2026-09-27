-- National Tourism Registry Core Phase 1B
-- First-class Attractions, Products, and Services.
-- These are authoritative Registry records; publication requires an active operator
-- wherever an operator relationship exists.

create table if not exists public.tourism_attractions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  summary text,
  destination_id uuid references public.destinations(id),
  operator_id uuid references public.operators(id),
  province_code text not null references public.provinces(code),
  attraction_type text not null default 'attraction',
  latitude double precision,
  longitude double precision,
  publication_status public.publication_status not null default 'draft',
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((latitude is null and longitude is null) or (latitude between -90 and 90 and longitude between -180 and 180))
);

create table if not exists public.tourism_products (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references public.operators(id),
  name text not null,
  slug text not null unique,
  description text,
  summary text,
  destination_id uuid references public.destinations(id),
  province_code text not null references public.provinces(code),
  product_type text not null default 'tourism_product',
  publication_status public.publication_status not null default 'draft',
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tourism_services (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid not null references public.operators(id),
  name text not null,
  slug text not null unique,
  description text,
  summary text,
  destination_id uuid references public.destinations(id),
  province_code text not null references public.provinces(code),
  service_type text not null default 'tourism_service',
  publication_status public.publication_status not null default 'draft',
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tourism_attractions_destination on public.tourism_attractions(destination_id);
create index if not exists idx_tourism_attractions_operator on public.tourism_attractions(operator_id);
create index if not exists idx_tourism_attractions_province_status on public.tourism_attractions(province_code, publication_status);
create index if not exists idx_tourism_products_operator on public.tourism_products(operator_id);
create index if not exists idx_tourism_products_destination on public.tourism_products(destination_id);
create index if not exists idx_tourism_products_province_status on public.tourism_products(province_code, publication_status);
create index if not exists idx_tourism_services_operator on public.tourism_services(operator_id);
create index if not exists idx_tourism_services_destination on public.tourism_services(destination_id);
create index if not exists idx_tourism_services_province_status on public.tourism_services(province_code, publication_status);

alter table public.tourism_attractions enable row level security;
alter table public.tourism_products enable row level security;
alter table public.tourism_services enable row level security;

create or replace function public.validate_tourism_attraction_publication()
returns trigger
language plpgsql
set search_path = public
as $function$
declare
  operator_status text;
begin
  if new.publication_status = 'published' and new.operator_id is not null then
    select status into operator_status from public.operators where id = new.operator_id;
    if operator_status is distinct from 'active' then
      raise exception 'Published tourism attractions with an operator require an active operator' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$function$;

create or replace function public.validate_tourism_product_publication()
returns trigger
language plpgsql
set search_path = public
as $function$
declare
  operator_status text;
begin
  if new.publication_status = 'published' then
    select status into operator_status from public.operators where id = new.operator_id;
    if operator_status is distinct from 'active' then
      raise exception 'Published tourism products require an active operator' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$function$;

create or replace function public.validate_tourism_service_publication()
returns trigger
language plpgsql
set search_path = public
as $function$
declare
  operator_status text;
begin
  if new.publication_status = 'published' then
    select status into operator_status from public.operators where id = new.operator_id;
    if operator_status is distinct from 'active' then
      raise exception 'Published tourism services require an active operator' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$function$;

drop trigger if exists trg_validate_tourism_attraction_publication on public.tourism_attractions;
create trigger trg_validate_tourism_attraction_publication
before insert or update of operator_id, publication_status on public.tourism_attractions
for each row execute function public.validate_tourism_attraction_publication();

drop trigger if exists trg_validate_tourism_product_publication on public.tourism_products;
create trigger trg_validate_tourism_product_publication
before insert or update of operator_id, publication_status on public.tourism_products
for each row execute function public.validate_tourism_product_publication();

drop trigger if exists trg_validate_tourism_service_publication on public.tourism_services;
create trigger trg_validate_tourism_service_publication
before insert or update of operator_id, publication_status on public.tourism_services
for each row execute function public.validate_tourism_service_publication();

create or replace function public.validate_operator_status_transition()
returns trigger
language plpgsql
set search_path = public
as $function$
begin
  if new.status is distinct from old.status then
    if not (
      (old.status = 'draft' and new.status in ('pending_review','closed')) or
      (old.status = 'pending_review' and new.status in ('active','rejected','closed')) or
      (old.status = 'rejected' and new.status in ('draft','closed')) or
      (old.status = 'active' and new.status in ('suspended','closed')) or
      (old.status = 'suspended' and new.status in ('active','closed'))
    ) then
      raise exception 'Invalid operator status transition: % -> %', old.status, new.status using errcode = '23514';
    end if;
  end if;

  if new.status = 'pending_review' and old.status is distinct from 'pending_review' then
    new.submitted_at = coalesce(new.submitted_at, now());
  end if;

  if new.status in ('active','rejected') and old.status is distinct from new.status then
    new.reviewed_at = coalesce(new.reviewed_at, now());
  end if;

  if new.status = 'suspended' and old.status is distinct from 'suspended' then
    new.suspended_at = coalesce(new.suspended_at, now());
  end if;

  if new.status = 'closed' and old.status is distinct from 'closed' then
    new.closed_at = coalesce(new.closed_at, now());
  end if;

  if new.status = 'rejected' and nullif(trim(coalesce(new.rejection_reason,'')), '') is null then
    raise exception 'rejection_reason is required when rejecting an operator' using errcode = '23514';
  end if;

  if new.status is distinct from 'active' then
    update public.industry_profiles
       set published = false,
           review_status = case when review_status = 'published' then 'suspended' else review_status end,
           updated_at = now()
     where operator_id = new.id
       and (published or review_status = 'published');

    update public.industry_experiences
       set status = 'suspended',
           updated_at = now()
     where operator_id = new.id
       and status = 'published';

    update public.tourism_attractions
       set publication_status = 'archived',
           updated_at = now()
     where operator_id = new.id
       and publication_status = 'published';

    update public.tourism_products
       set publication_status = 'archived',
           updated_at = now()
     where operator_id = new.id
       and publication_status = 'published';

    update public.tourism_services
       set publication_status = 'archived',
           updated_at = now()
     where operator_id = new.id
       and publication_status = 'published';
  end if;

  return new;
end;
$function$;
