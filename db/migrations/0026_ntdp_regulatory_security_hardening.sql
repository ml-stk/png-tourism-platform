begin;

create or replace function regulatory_mark_overdue_actions()
returns integer
language plpgsql
set search_path = public, pg_temp
as $$
declare affected integer;
begin
  update regulatory_compliance_actions
  set status='overdue', updated_at=now()
  where status in ('open','in_progress') and due_at is not null and due_at < now();
  get diagnostics affected = row_count;
  return affected;
end;
$$;

create or replace function regulatory_expire_licenses()
returns integer
language plpgsql
set search_path = public, pg_temp
as $$
declare affected integer;
begin
  update regulatory_licenses
  set status='expired', updated_at=now()
  where status='approved' and expires_at is not null and expires_at < now();
  get diagnostics affected = row_count;
  return affected;
end;
$$;

create or replace function regulatory_sync_operator_compliance()
returns integer
language plpgsql
set search_path = public, pg_temp
as $$
declare affected integer;
begin
  update operators o
  set compliance_status = case
    when exists (
      select 1 from regulatory_compliance_actions a
      where a.operator_id=o.id and a.status in ('open','in_progress','overdue')
    ) then 'non_compliant'::compliance_status
    when exists (
      select 1 from regulatory_licenses l
      where l.operator_id=o.id and l.status in ('approved','expired')
        and (l.expires_at is null or l.expires_at >= now() or l.status='expired')
    ) and exists (
      select 1 from regulatory_licenses l
      where l.operator_id=o.id and l.status='expired'
    ) then 'non_compliant'::compliance_status
    when exists (
      select 1 from regulatory_licenses l
      where l.operator_id=o.id and l.status='approved' and (l.expires_at is null or l.expires_at >= now())
    ) then 'compliant'::compliance_status
    else 'unknown'::compliance_status
  end,
  updated_at=now()
  where exists (select 1 from regulatory_licenses l where l.operator_id=o.id)
     or exists (select 1 from regulatory_compliance_actions a where a.operator_id=o.id);
  get diagnostics affected = row_count;
  return affected;
end;
$$;

create or replace function tia_record_membership_event()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  insert into tia_membership_events(membership_id, from_status, to_status, changed_by, metadata)
  values (new.id, old.status, new.status, null, jsonb_build_object('trigger','status_transition'));
  return new;
end;
$$;

create or replace function tia_expire_memberships()
returns integer
language plpgsql
set search_path = public, pg_temp
as $$
declare affected integer;
begin
  update tia_memberships
  set status='expired', updated_at=now()
  where status='active' and expires_at is not null and expires_at < now();
  get diagnostics affected = row_count;
  return affected;
end;
$$;

create or replace function analytics.refresh_daily_metrics(target_date date default current_date)
returns integer
language plpgsql
set search_path = analytics, public, pg_temp
as $$
declare affected integer := 0;
begin
  insert into daily_metric_fact(metric_date,metric_code,province_code,metric_value,source)
  select target_date,'visitor_events',province_code,count(*)::numeric,'analytics.visitor_event_fact'
  from visitor_event_fact
  where occurred_at >= target_date::timestamptz and occurred_at < (target_date + 1)::timestamptz
  group by province_code
  on conflict (metric_date,metric_code,coalesce(province_code,'__NATIONAL__'))
  do update set metric_value=excluded.metric_value,source=excluded.source,created_at=now();
  get diagnostics affected = row_count;

  insert into daily_metric_fact(metric_date,metric_code,province_code,metric_value,source)
  select target_date,'registered_operators',province_code,count(*)::numeric,'operators'
  from public.operators group by province_code
  on conflict (metric_date,metric_code,coalesce(province_code,'__NATIONAL__'))
  do update set metric_value=excluded.metric_value,source=excluded.source,created_at=now();
  affected := affected + 1;

  insert into daily_metric_fact(metric_date,metric_code,province_code,metric_value,source)
  select target_date,'active_operators',province_code,count(*)::numeric,'operators'
  from public.operators where status='active' group by province_code
  on conflict (metric_date,metric_code,coalesce(province_code,'__NATIONAL__'))
  do update set metric_value=excluded.metric_value,source=excluded.source,created_at=now();
  affected := affected + 1;

  insert into daily_metric_fact(metric_date,metric_code,province_code,metric_value,source)
  select target_date,'compliant_operators',province_code,count(*)::numeric,'operators'
  from public.operators where compliance_status='compliant' group by province_code
  on conflict (metric_date,metric_code,coalesce(province_code,'__NATIONAL__'))
  do update set metric_value=excluded.metric_value,source=excluded.source,created_at=now();
  affected := affected + 1;
  return affected;
end;
$$;

commit;
