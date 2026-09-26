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
    update industry_profiles
       set published = false,
           review_status = case when review_status = 'published' then 'suspended' else review_status end,
           updated_at = now()
     where operator_id = new.id
       and (published or review_status = 'published');

    update industry_experiences
       set status = 'suspended',
           updated_at = now()
     where operator_id = new.id
       and status = 'published';
  end if;

  return new;
end;
$function$;

create or replace function public.validate_industry_profile_publication()
returns trigger
language plpgsql
set search_path = public
as $function$
declare
  operator_status text;
begin
  if new.published then
    select status into operator_status from operators where id = new.operator_id;
    if operator_status is distinct from 'active' then
      raise exception 'Published industry profiles require an active operator' using errcode = '23514';
    end if;
    new.review_status := 'published';
  end if;
  return new;
end;
$function$;

create or replace function public.validate_industry_experience_publication()
returns trigger
language plpgsql
set search_path = public
as $function$
declare
  operator_status text;
begin
  if new.status = 'published' then
    select status into operator_status from operators where id = new.operator_id;
    if operator_status is distinct from 'active' then
      raise exception 'Published industry experiences require an active operator' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$function$;

drop trigger if exists trg_validate_industry_profile_publication on industry_profiles;
create trigger trg_validate_industry_profile_publication
before insert or update of operator_id, published, review_status on industry_profiles
for each row execute function public.validate_industry_profile_publication();

drop trigger if exists trg_validate_industry_experience_publication on industry_experiences;
create trigger trg_validate_industry_experience_publication
before insert or update of operator_id, status on industry_experiences
for each row execute function public.validate_industry_experience_publication();
