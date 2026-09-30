alter type public.operator_status add value if not exists 'rejected';

alter table public.operators
  add column if not exists registration_number text,
  add column if not exists operator_type text,
  add column if not exists contact_email text,
  add column if not exists contact_phone text,
  add column if not exists website_url text,
  add column if not exists submitted_at timestamptz,
  add column if not exists reviewed_at timestamptz,
  add column if not exists rejection_reason text,
  add column if not exists status_reason text,
  add column if not exists suspended_at timestamptz,
  add column if not exists closed_at timestamptz;

create unique index if not exists operators_registration_number_uidx
  on public.operators (registration_number)
  where registration_number is not null;

alter table public.operators
  add constraint operators_contact_email_format_chk
  check (contact_email is null or contact_email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$');

alter table public.operators
  add constraint operators_website_url_format_chk
  check (website_url is null or website_url ~* '^https?://');

create or replace function public.validate_operator_status_transition()
returns trigger
language plpgsql
as $$
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

  return new;
end;
$$;

drop trigger if exists trg_validate_operator_status_transition on public.operators;
create trigger trg_validate_operator_status_transition
before update of status on public.operators
for each row execute function public.validate_operator_status_transition();
