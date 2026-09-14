create table if not exists analytics.metric_definitions (
  metric_code text primary key,
  name text not null,
  description text not null,
  grain text not null check (grain in ('daily','event')),
  source_table text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into analytics.metric_definitions(metric_code,name,description,grain,source_table) values
 ('visitor_events','Visitor events','Count of governed visitor events recorded by source and province.','daily','analytics.visitor_event_fact'),
 ('active_operators','Active operators','Count of operators with active registry status.','daily','operators'),
 ('compliant_operators','Compliant operators','Count of operators with compliant status.','daily','operators'),
 ('registered_operators','Registered operators','Count of operators represented in the authoritative registry.','daily','operators')
on conflict (metric_code) do nothing;

create table if not exists analytics.etl_runs (
  id uuid primary key default gen_random_uuid(),
  job_name text not null,
  run_date date not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null check (status in ('running','succeeded','failed')),
  rows_affected integer not null default 0,
  error_message text
);
create index if not exists idx_analytics_etl_runs_job_date on analytics.etl_runs(job_name, run_date desc);

create or replace function analytics.refresh_daily_metrics(target_date date default current_date) returns integer
language plpgsql
as $$
declare affected integer := 0;
begin
  insert into analytics.daily_metric_fact(metric_date,metric_code,province_code,metric_value,source)
  select target_date,'visitor_events',province_code,count(*)::numeric,'analytics.visitor_event_fact'
  from analytics.visitor_event_fact
  where occurred_at >= target_date::timestamptz and occurred_at < (target_date + 1)::timestamptz
  group by province_code
  on conflict (metric_date,metric_code,coalesce(province_code,'__NATIONAL__'))
  do update set metric_value=excluded.metric_value,source=excluded.source,created_at=now();
  get diagnostics affected = row_count;

  insert into analytics.daily_metric_fact(metric_date,metric_code,province_code,metric_value,source)
  select target_date,'registered_operators',province_code,count(*)::numeric,'operators'
  from operators group by province_code
  on conflict (metric_date,metric_code,coalesce(province_code,'__NATIONAL__'))
  do update set metric_value=excluded.metric_value,source=excluded.source,created_at=now();
  affected := affected + 1;

  insert into analytics.daily_metric_fact(metric_date,metric_code,province_code,metric_value,source)
  select target_date,'active_operators',province_code,count(*)::numeric,'operators'
  from operators where status='active' group by province_code
  on conflict (metric_date,metric_code,coalesce(province_code,'__NATIONAL__'))
  do update set metric_value=excluded.metric_value,source=excluded.source,created_at=now();
  affected := affected + 1;

  insert into analytics.daily_metric_fact(metric_date,metric_code,province_code,metric_value,source)
  select target_date,'compliant_operators',province_code,count(*)::numeric,'operators'
  from operators where compliance_status='compliant' group by province_code
  on conflict (metric_date,metric_code,coalesce(province_code,'__NATIONAL__'))
  do update set metric_value=excluded.metric_value,source=excluded.source,created_at=now();
  affected := affected + 1;

  return affected;
end;
$$;

create index if not exists idx_analytics_daily_metric_code_date on analytics.daily_metric_fact(metric_code, metric_date desc);
