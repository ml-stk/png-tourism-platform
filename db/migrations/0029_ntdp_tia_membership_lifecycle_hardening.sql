create or replace function tia_record_membership_event() returns trigger language plpgsql as $$
declare
  actor uuid;
  allowed boolean := true;
begin
  actor := nullif(current_setting('app.tia_actor_id', true), '')::uuid;

  if tg_op = 'INSERT' then
    if new.status <> 'applied' then
      raise exception using errcode='P0001', message='Membership applications must start in applied status';
    end if;
    if new.renewal_of is not null then
      if not exists (
        select 1 from tia_memberships source
        where source.id = new.renewal_of
          and source.status in ('active','suspended','expired')
      ) then
        raise exception using errcode='P0001', message='Membership renewal source must be active, suspended or expired';
      end if;
    end if;
    insert into tia_membership_events(membership_id,to_status,changed_by,reason)
    values(new.id,new.status,actor,case when new.renewal_of is null then 'membership application' else 'membership renewal application' end);
    return new;
  end if;

  if new.status is distinct from old.status then
    allowed := case
      when old.status='applied' and new.status in ('active','cancelled') then true
      when old.status='active' and new.status in ('suspended','cancelled','expired') then true
      when old.status='suspended' and new.status in ('active','cancelled','expired') then true
      else false
    end;
    if not allowed then
      raise exception using errcode='P0001', message=format('Invalid membership status transition: %s -> %s', old.status, new.status);
    end if;
    insert into tia_membership_events(membership_id,from_status,to_status,changed_by,reason)
    values(new.id,old.status,new.status,actor,'membership status transition');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_tia_membership_event on tia_memberships;
create trigger trg_tia_membership_event
  after insert or update of status on tia_memberships
  for each row execute function tia_record_membership_event();

create unique index if not exists ux_tia_memberships_membership_number
  on tia_memberships(membership_number)
  where membership_number is not null;

create index if not exists idx_tia_memberships_operator_status
  on tia_memberships(operator_id,status,created_at desc);
