-- Reconcile the deployed registry asset model with the fresh-platform model.
-- This is additive: preserve production registry IDs and compatibility columns while
-- making publication_status the canonical lifecycle field.

alter table public.tourism_attractions
  add column if not exists registry_id text,
  add column if not exists slug text,
  add column if not exists summary text,
  add column if not exists province_id uuid references public.provinces(id),
  add column if not exists province_code text references public.provinces(code),
  add column if not exists status text,
  add column if not exists publication_status public.publication_status;

alter table public.tourism_products
  add column if not exists registry_id text,
  add column if not exists slug text,
  add column if not exists summary text,
  add column if not exists province_id uuid references public.provinces(id),
  add column if not exists province_code text references public.provinces(code),
  add column if not exists status text,
  add column if not exists publication_status public.publication_status;

alter table public.tourism_services
  add column if not exists registry_id text,
  add column if not exists slug text,
  add column if not exists summary text,
  add column if not exists province_id uuid references public.provinces(id),
  add column if not exists province_code text references public.provinces(code),
  add column if not exists status text,
  add column if not exists publication_status public.publication_status;

alter table public.tourism_attractions alter column registry_id set default
  ('ATT-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)));
alter table public.tourism_products alter column registry_id set default
  ('PRD-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)));
alter table public.tourism_services alter column registry_id set default
  ('SRV-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)));

update public.tourism_attractions
set registry_id = 'ATT-' || upper(substr(replace(id::text, '-', ''), 1, 12))
where registry_id is null;
update public.tourism_products
set registry_id = 'PRD-' || upper(substr(replace(id::text, '-', ''), 1, 12))
where registry_id is null;
update public.tourism_services
set registry_id = 'SRV-' || upper(substr(replace(id::text, '-', ''), 1, 12))
where registry_id is null;

update public.tourism_attractions
set slug = lower(trim(both '-' from regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g')))
  || '-' || substr(replace(id::text, '-', ''), 1, 8)
where slug is null;
update public.tourism_products
set slug = lower(trim(both '-' from regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g')))
  || '-' || substr(replace(id::text, '-', ''), 1, 8)
where slug is null;
update public.tourism_services
set slug = lower(trim(both '-' from regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g')))
  || '-' || substr(replace(id::text, '-', ''), 1, 8)
where slug is null;

update public.tourism_attractions set publication_status = case status
  when 'submitted' then 'review'::public.publication_status
  when 'published' then 'published'::public.publication_status
  when 'suspended' then 'archived'::public.publication_status
  else 'draft'::public.publication_status end
where publication_status is null;
update public.tourism_products set publication_status = case status
  when 'submitted' then 'review'::public.publication_status
  when 'published' then 'published'::public.publication_status
  when 'suspended' then 'archived'::public.publication_status
  else 'draft'::public.publication_status end
where publication_status is null;
update public.tourism_services set publication_status = case status
  when 'submitted' then 'review'::public.publication_status
  when 'published' then 'published'::public.publication_status
  when 'suspended' then 'archived'::public.publication_status
  else 'draft'::public.publication_status end
where publication_status is null;

update public.tourism_attractions set status = case publication_status
  when 'review' then 'submitted' when 'published' then 'published'
  when 'archived' then 'suspended' else 'draft' end where status is null;
update public.tourism_products set status = case publication_status
  when 'review' then 'submitted' when 'published' then 'published'
  when 'archived' then 'suspended' else 'draft' end where status is null;
update public.tourism_services set status = case publication_status
  when 'review' then 'submitted' when 'published' then 'published'
  when 'archived' then 'suspended' else 'draft' end where status is null;

update public.tourism_attractions a set province_code = p.code
from public.provinces p where a.province_code is null and p.id = a.province_id;
update public.tourism_products a set province_code = p.code
from public.provinces p where a.province_code is null and p.id = a.province_id;
update public.tourism_services a set province_code = p.code
from public.provinces p where a.province_code is null and p.id = a.province_id;

update public.tourism_attractions a set province_id = p.id
from public.provinces p where a.province_id is null and p.code = a.province_code;
update public.tourism_products a set province_id = p.id
from public.provinces p where a.province_id is null and p.code = a.province_code;
update public.tourism_services a set province_id = p.id
from public.provinces p where a.province_id is null and p.code = a.province_code;

alter table public.tourism_attractions
  alter column registry_id set not null,
  alter column slug set not null,
  alter column status set default 'draft',
  alter column status set not null,
  alter column publication_status set default 'draft',
  alter column publication_status set not null,
  alter column province_code drop not null;
alter table public.tourism_products
  alter column registry_id set not null,
  alter column slug set not null,
  alter column status set default 'draft',
  alter column status set not null,
  alter column publication_status set default 'draft',
  alter column publication_status set not null,
  alter column province_code drop not null;
alter table public.tourism_services
  alter column registry_id set not null,
  alter column slug set not null,
  alter column status set default 'draft',
  alter column status set not null,
  alter column publication_status set default 'draft',
  alter column publication_status set not null,
  alter column province_code drop not null;

do $block$
declare
  item record;
begin
  for item in select * from (values
    ('tourism_attractions', 'registry_id', 'tourism_attractions_registry_id_uidx'),
    ('tourism_products', 'registry_id', 'tourism_products_registry_id_uidx'),
    ('tourism_services', 'registry_id', 'tourism_services_registry_id_uidx'),
    ('tourism_attractions', 'slug', 'tourism_attractions_slug_uidx'),
    ('tourism_products', 'slug', 'tourism_products_slug_uidx'),
    ('tourism_services', 'slug', 'tourism_services_slug_uidx')
  ) as indexes(table_name, column_name, index_name)
  loop
    if not exists (
      select 1
      from pg_catalog.pg_index i
      join pg_catalog.pg_class t on t.oid = i.indrelid
      join pg_catalog.pg_namespace n on n.oid = t.relnamespace
      join pg_catalog.pg_attribute a
        on a.attrelid = t.oid and a.attnum = any(i.indkey)
      where n.nspname = 'public'
        and t.relname = item.table_name
        and a.attname = item.column_name
        and i.indisunique
        and i.indnkeyatts = 1
    ) then
      execute format('create unique index %I on public.%I(%I)',
        item.index_name, item.table_name, item.column_name);
    end if;
  end loop;
end;
$block$;
create index if not exists idx_tourism_attractions_province_id on public.tourism_attractions(province_id);
create index if not exists idx_tourism_products_province_id on public.tourism_products(province_id);
create index if not exists idx_tourism_services_province_id on public.tourism_services(province_id);

create or replace function public.sync_tourism_asset_contract()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $function$
declare
  mapped_status text;
  mapped_publication public.publication_status;
  mapped_province_id uuid;
  mapped_province_code text;
begin
  if new.slug is null then
    new.slug := lower(trim(both '-' from regexp_replace(new.name, '[^a-zA-Z0-9]+', '-', 'g')))
      || '-' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;

  mapped_status := case new.publication_status
    when 'review' then 'submitted' when 'published' then 'published'
    when 'archived' then 'suspended' else 'draft' end;
  mapped_publication := case new.status
    when 'submitted' then 'review'::public.publication_status
    when 'published' then 'published'::public.publication_status
    when 'suspended' then 'archived'::public.publication_status
    else 'draft'::public.publication_status end;

  if tg_op = 'INSERT' and new.publication_status = 'draft' and new.status <> 'draft' then
    new.publication_status := mapped_publication;
  elsif tg_op = 'INSERT' and new.status = 'draft' and new.publication_status <> 'draft' then
    new.status := mapped_status;
  elsif tg_op = 'UPDATE' and new.publication_status is distinct from old.publication_status
      and new.status is not distinct from old.status then
    new.status := mapped_status;
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status
      and new.publication_status is not distinct from old.publication_status then
    new.publication_status := mapped_publication;
  elsif new.status is distinct from mapped_status then
    raise exception 'Inconsistent tourism asset lifecycle values: status %, publication_status %',
      new.status, new.publication_status using errcode = '23514';
  end if;

  if new.province_code is not null then
    select id into mapped_province_id from public.provinces where code = new.province_code;
    if mapped_province_id is null then
      raise exception 'Unknown tourism asset province code: %', new.province_code using errcode = '23503';
    end if;
  end if;
  if new.province_id is not null then
    select code into mapped_province_code from public.provinces where id = new.province_id;
    if mapped_province_code is null then
      raise exception 'Unknown tourism asset province id: %', new.province_id using errcode = '23503';
    end if;
  end if;

  if tg_op = 'UPDATE' and new.province_code is distinct from old.province_code
      and new.province_id is not distinct from old.province_id then
    new.province_id := mapped_province_id;
  elsif tg_op = 'UPDATE' and new.province_id is distinct from old.province_id
      and new.province_code is not distinct from old.province_code then
    new.province_code := mapped_province_code;
  elsif new.province_code is null and new.province_id is not null then
    new.province_code := mapped_province_code;
  elsif new.province_id is null and new.province_code is not null then
    new.province_id := mapped_province_id;
  elsif new.province_id is not null and new.province_code is not null
      and mapped_province_id is distinct from new.province_id then
    raise exception 'Inconsistent tourism asset province values' using errcode = '23514';
  end if;

  return new;
end;
$function$;

create or replace function public.validate_tourism_asset_publication()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $function$
begin
  if new.publication_status = 'published' and new.operator_id is not null
      and not exists (
        select 1 from public.operators o where o.id = new.operator_id and o.status = 'active'
      ) then
    raise exception 'Published tourism assets require an active operator' using errcode = '23514';
  end if;
  return new;
end;
$function$;

drop trigger if exists trg_tourism_attractions_publication on public.tourism_attractions;
drop trigger if exists trg_tourism_products_publication on public.tourism_products;
drop trigger if exists trg_tourism_services_publication on public.tourism_services;
drop trigger if exists trg_validate_tourism_attraction_publication on public.tourism_attractions;
drop trigger if exists trg_validate_tourism_product_publication on public.tourism_products;
drop trigger if exists trg_validate_tourism_service_publication on public.tourism_services;

drop trigger if exists trg_00_sync_tourism_asset_contract on public.tourism_attractions;
create trigger trg_00_sync_tourism_asset_contract
before insert or update on public.tourism_attractions
for each row execute function public.sync_tourism_asset_contract();
drop trigger if exists trg_00_sync_tourism_asset_contract on public.tourism_products;
create trigger trg_00_sync_tourism_asset_contract
before insert or update on public.tourism_products
for each row execute function public.sync_tourism_asset_contract();
drop trigger if exists trg_00_sync_tourism_asset_contract on public.tourism_services;
create trigger trg_00_sync_tourism_asset_contract
before insert or update on public.tourism_services
for each row execute function public.sync_tourism_asset_contract();

create trigger trg_validate_tourism_asset_publication
before insert or update of operator_id, publication_status on public.tourism_attractions
for each row execute function public.validate_tourism_asset_publication();
create trigger trg_validate_tourism_asset_publication
before insert or update of operator_id, publication_status on public.tourism_products
for each row execute function public.validate_tourism_asset_publication();
create trigger trg_validate_tourism_asset_publication
before insert or update of operator_id, publication_status on public.tourism_services
for each row execute function public.validate_tourism_asset_publication();

revoke all on public.tourism_attractions, public.tourism_products, public.tourism_services
  from anon, authenticated;
grant select, insert, update, delete on
  public.tourism_attractions, public.tourism_products, public.tourism_services
  to service_role;
revoke execute on function public.sync_tourism_asset_contract() from public, anon, authenticated;
revoke execute on function public.validate_tourism_asset_publication() from public, anon, authenticated;
grant execute on function public.sync_tourism_asset_contract() to service_role;
grant execute on function public.validate_tourism_asset_publication() to service_role;
