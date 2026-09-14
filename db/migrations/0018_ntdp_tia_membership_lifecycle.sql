create table if not exists tia_membership_events (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references tia_memberships(id) on delete cascade,
  from_status text,
  to_status text not null check (to_status in ('applied','active','expired','suspended','cancelled')),
  changed_by uuid references users(id),
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  changed_at timestamptz not null default now()
);
create index if not exists idx_tia_membership_events_membership on tia_membership_events(membership_id, changed_at desc);
create index if not exists idx_tia_membership_events_status on tia_membership_events(to_status, changed_at desc);

create or replace function tia_record_membership_event() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    insert into tia_membership_events(membership_id,to_status,reason) values(new.id,new.status,'membership application');
  elsif new.status is distinct from old.status then
    insert into tia_membership_events(membership_id,from_status,to_status,reason) values(new.id,old.status,new.status,'membership status transition');
  end if;
  return new;
end;
$$;
drop trigger if exists trg_tia_membership_event on tia_memberships;
create trigger trg_tia_membership_event after insert or update of status on tia_memberships for each row execute function tia_record_membership_event();

create or replace function tia_expire_memberships() returns integer language plpgsql as $$
declare changed integer;
begin
  update tia_memberships set status='expired',updated_at=now()
  where status='active' and expires_at is not null and expires_at < current_date;
  get diagnostics changed = row_count;
  return changed;
end;
$$;

create index if not exists idx_tia_memberships_active_expiry on tia_memberships(status, expires_at) where status='active';
