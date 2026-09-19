create schema if not exists analytics;

create or replace view analytics.operator_registry as
select
  o.id as operator_id,
  o.legal_name,
  o.trading_name,
  o.province_code,
  o.status,
  o.compliance_status,
  o.operator_type,
  o.created_at,
  o.updated_at,
  coalesce(p.published_profiles, 0) as published_profiles,
  coalesce(e.published_experiences, 0) as published_experiences,
  coalesce(l.active_licenses, 0) as active_licenses,
  coalesce(m.active_memberships, 0) as active_memberships,
  s.development_status as sme_development_status
from public.operators o
left join (
  select operator_id, count(*) filter (where published and review_status = 'published')::bigint as published_profiles
  from public.industry_profiles group by operator_id
) p on p.operator_id = o.id
left join (
  select operator_id, count(*) filter (where status = 'published')::bigint as published_experiences
  from public.industry_experiences group by operator_id
) e on e.operator_id = o.id
left join (
  select operator_id, count(*) filter (where status = 'active')::bigint as active_licenses
  from public.regulatory_licenses group by operator_id
) l on l.operator_id = o.id
left join (
  select operator_id, count(*) filter (where status = 'active')::bigint as active_memberships
  from public.tia_memberships group by operator_id
) m on m.operator_id = o.id
left join public.sme_profiles s on s.operator_id = o.id;

create or replace view analytics.province_operator_summary as
select
  o.province_code,
  count(*)::bigint as total_operators,
  count(*) filter (where o.status = 'active')::bigint as active_operators,
  count(*) filter (where o.status = 'pending_review')::bigint as pending_review_operators,
  count(*) filter (where o.status = 'suspended')::bigint as suspended_operators,
  count(*) filter (where o.status = 'closed')::bigint as closed_operators,
  count(*) filter (where o.compliance_status = 'compliant')::bigint as compliant_operators
from public.operators o
group by o.province_code;

create or replace view analytics.destination_content_summary as
select
  d.id as destination_id,
  d.name,
  d.province_code,
  d.publication_status,
  count(distinct p.id) filter (where p.published and p.review_status = 'published' and o.status = 'active')::bigint as active_published_profiles,
  count(distinct e.id) filter (where e.status = 'published' and o2.status = 'active')::bigint as active_published_experiences
from public.destinations d
left join public.industry_profiles p on p.province_code = d.province_code
left join public.operators o on o.id = p.operator_id
left join public.industry_experiences e on e.destination_id = d.id
left join public.operators o2 on o2.id = e.operator_id
group by d.id, d.name, d.province_code, d.publication_status;

create or replace view analytics.visitor_engagement_daily as
select
  date_trunc('day', occurred_at)::date as engagement_date,
  province_code,
  source,
  event_type,
  count(*)::bigint as event_count,
  count(distinct operator_id)::bigint as operators_engaged,
  count(distinct destination_id)::bigint as destinations_engaged
from public.visitor_engagement_events
where occurred_at is not null
group by 1, 2, 3, 4;

create or replace view analytics.executive_kpis as
select
  (select count(*) from public.operators)::bigint as total_operators,
  (select count(*) from public.operators where status = 'active')::bigint as active_operators,
  (select count(*) from public.operators where status = 'pending_review')::bigint as pending_review_operators,
  (select count(*) from public.operators where status = 'suspended')::bigint as suspended_operators,
  (select count(*) from public.destinations where publication_status = 'published')::bigint as published_destinations,
  (select count(*) from public.industry_profiles where published and review_status = 'published')::bigint as published_profiles,
  (select count(*) from public.industry_experiences where status = 'published')::bigint as published_experiences,
  (select count(*) from public.visitor_engagement_events where occurred_at >= now() - interval '30 days')::bigint as engagement_events_30d,
  (select count(*) from public.visitor_leads where created_at >= now() - interval '30 days')::bigint as visitor_leads_30d,
  now() as generated_at;

revoke all on schema analytics from public, anon, authenticated;
grant usage on schema analytics to service_role;
revoke all on all tables in schema analytics from public, anon, authenticated;
grant select on all tables in schema analytics to service_role;
