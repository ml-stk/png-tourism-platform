create or replace view analytics.province_tourism_intelligence as
with operator_summary as (
  select
    province_code,
    count(*)::bigint as total_operators,
    count(*) filter (where status = 'active')::bigint as active_operators,
    count(*) filter (where status = 'pending_review')::bigint as pending_review_operators,
    count(*) filter (where status = 'suspended')::bigint as suspended_operators,
    count(*) filter (where compliance_status = 'compliant')::bigint as compliant_operators
  from public.operators
  group by province_code
),
profile_summary as (
  select o.province_code,
    count(distinct p.id) filter (where p.published and p.review_status = 'published' and o.status = 'active')::bigint as active_published_profiles
  from public.operators o
  left join public.industry_profiles p on p.operator_id = o.id
  group by o.province_code
),
experience_summary as (
  select o.province_code,
    count(distinct e.id) filter (where e.status = 'published' and o.status = 'active')::bigint as active_published_experiences
  from public.operators o
  left join public.industry_experiences e on e.operator_id = o.id
  group by o.province_code
),
license_summary as (
  select o.province_code,
    count(distinct l.id) filter (where l.status = 'active')::bigint as active_licenses
  from public.operators o
  left join public.regulatory_licenses l on l.operator_id = o.id
  group by o.province_code
),
membership_summary as (
  select o.province_code,
    count(distinct m.id) filter (where m.status = 'active')::bigint as active_tia_memberships
  from public.operators o
  left join public.tia_memberships m on m.operator_id = o.id
  group by o.province_code
),
engagement_summary as (
  select province_code,
    count(*) filter (where occurred_at >= now() - interval '30 days')::bigint as engagement_events_30d
  from public.visitor_engagement_events
  group by province_code
),
lead_summary as (
  select o.province_code,
    count(vl.id) filter (where vl.created_at >= now() - interval '30 days')::bigint as visitor_leads_30d
  from public.visitor_leads vl
  join public.operators o on o.id = vl.operator_id
  group by o.province_code
)
select
  os.province_code,
  os.total_operators,
  os.active_operators,
  os.pending_review_operators,
  os.suspended_operators,
  os.compliant_operators,
  coalesce(ps.active_published_profiles, 0)::bigint as active_published_profiles,
  coalesce(es.active_published_experiences, 0)::bigint as active_published_experiences,
  coalesce(ls.active_licenses, 0)::bigint as active_licenses,
  coalesce(ms.active_tia_memberships, 0)::bigint as active_tia_memberships,
  coalesce(egs.engagement_events_30d, 0)::bigint as engagement_events_30d,
  coalesce(lsd.visitor_leads_30d, 0)::bigint as visitor_leads_30d
from operator_summary os
left join profile_summary ps using (province_code)
left join experience_summary es using (province_code)
left join license_summary ls using (province_code)
left join membership_summary ms using (province_code)
left join engagement_summary egs using (province_code)
left join lead_summary lsd using (province_code);

create or replace view analytics.destination_performance as
select
  d.id as destination_id,
  d.name,
  d.province_code,
  d.publication_status,
  count(distinct p.id) filter (where p.published and p.review_status = 'published' and op.status = 'active')::bigint as active_published_profiles,
  count(distinct e.id) filter (where e.status = 'published' and oe.status = 'active')::bigint as active_published_experiences,
  count(distinct ve.id) filter (where ve.occurred_at >= now() - interval '30 days')::bigint as engagement_events_30d,
  count(distinct vl.id) filter (where vl.created_at >= now() - interval '30 days')::bigint as visitor_leads_30d
from public.destinations d
left join public.industry_experiences e on e.destination_id = d.id
left join public.operators oe on oe.id = e.operator_id
left join public.industry_profiles p on p.province_code = d.province_code
left join public.operators op on op.id = p.operator_id
left join public.visitor_engagement_events ve on ve.destination_id = d.id
left join public.visitor_leads vl on vl.experience_id = e.id
  and vl.created_at >= now() - interval '30 days'
group by d.id, d.name, d.province_code, d.publication_status;

create or replace view analytics.engagement_trends_30d as
select
  engagement_date,
  source,
  event_type,
  sum(event_count)::bigint as event_count,
  sum(operators_engaged)::bigint as operators_engaged,
  sum(destinations_engaged)::bigint as destinations_engaged
from analytics.visitor_engagement_daily
where engagement_date >= current_date - 29
  and engagement_date <= current_date
group by engagement_date, source, event_type
order by engagement_date desc;

create or replace view analytics.executive_dashboard as
select
  k.total_operators,
  k.active_operators,
  k.pending_review_operators,
  k.suspended_operators,
  k.published_destinations,
  k.published_profiles,
  k.published_experiences,
  k.engagement_events_30d,
  k.visitor_leads_30d,
  round((100.0 * k.active_operators / nullif(k.total_operators, 0))::numeric, 2) as active_operator_rate_pct,
  round((100.0 * k.published_profiles / nullif(k.active_operators, 0))::numeric, 2) as active_operator_profile_coverage_pct,
  round((100.0 * k.visitor_leads_30d / nullif(k.engagement_events_30d, 0))::numeric, 2) as engagement_to_lead_rate_pct,
  k.generated_at
from analytics.executive_kpis k;

grant select on analytics.province_tourism_intelligence to service_role;
grant select on analytics.destination_performance to service_role;
grant select on analytics.engagement_trends_30d to service_role;
grant select on analytics.executive_dashboard to service_role;
