create table if not exists regulatory_status_events (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('license','inspection','compliance_action')),
  entity_id uuid not null,
  from_status text,
  to_status text not null,
  changed_by uuid references users(id),
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  changed_at timestamptz not null default now()
);
create index if not exists idx_regulatory_status_events_entity on regulatory_status_events(entity_type, entity_id, changed_at desc);

create index if not exists idx_regulatory_licenses_expiry on regulatory_licenses(expires_at) where status='approved';
create index if not exists idx_regulatory_inspections_due on regulatory_inspections(next_due_date) where next_due_date is not null;
create index if not exists idx_regulatory_actions_due on regulatory_compliance_actions(due_at) where status in ('open','in_progress');

create or replace function regulatory_mark_overdue_actions()
returns integer
language plpgsql
as $$
declare affected integer;
begin
  update regulatory_compliance_actions
  set status='overdue', updated_at=now()
  where status in ('open','in_progress')
    and due_at is not null
    and due_at < now();
  get diagnostics affected = row_count;
  return affected;
end;
$$;

create or replace function regulatory_expire_licenses()
returns integer
language plpgsql
as $$
declare affected integer;
begin
  update regulatory_licenses
  set status='expired', updated_at=now()
  where status='approved'
    and expires_at is not null
    and expires_at < now();
  get diagnostics affected = row_count;
  return affected;
end;
$$;

create or replace function regulatory_sync_operator_compliance()
returns integer
language plpgsql
as $$
declare affected integer;
begin
  update operators o
  set compliance_status = case
    when exists (select 1 from regulatory_compliance_actions a where a.operator_id=o.id and a.status in ('open','in_progress','overdue')) then 'non_compliant'::operator_compliance_status
    when exists (select 1 from regulatory_licenses l where l.operator_id=o.id and l.status='approved' and (l.expires_at is null or l.expires_at >= now())) then 'compliant'::operator_compliance_status
    when exists (select 1 from regulatory_licenses l where l.operator_id=o.id and l.status='approved' and l.expires_at is not null and l.expires_at < now()) then 'non_compliant'::operator_compliance_status
    else 'unknown'::operator_compliance_status
  end,
  updated_at=now()
  where exists (select 1 from regulatory_licenses l where l.operator_id=o.id)
     or exists (select 1 from regulatory_compliance_actions a where a.operator_id=o.id);
  get diagnostics affected = row_count;
  return affected;
end;
$$;
