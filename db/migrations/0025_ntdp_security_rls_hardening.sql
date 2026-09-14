begin;

alter table public.sme_profiles enable row level security;
alter table public.sme_assessments enable row level security;
alter table public.sme_development_programs enable row level security;
alter table public.sme_program_enrolments enable row level security;
alter table public.tia_memberships enable row level security;
alter table public.tia_membership_events enable row level security;
alter table public.regulatory_licenses enable row level security;
alter table public.regulatory_inspections enable row level security;
alter table public.regulatory_compliance_actions enable row level security;
alter table public.regulatory_status_events enable row level security;

create policy sme_profiles_service_role on public.sme_profiles for all to service_role using (true) with check (true);
create policy sme_assessments_service_role on public.sme_assessments for all to service_role using (true) with check (true);
create policy sme_development_programs_service_role on public.sme_development_programs for all to service_role using (true) with check (true);
create policy sme_program_enrolments_service_role on public.sme_program_enrolments for all to service_role using (true) with check (true);
create policy tia_memberships_service_role on public.tia_memberships for all to service_role using (true) with check (true);
create policy tia_membership_events_service_role on public.tia_membership_events for all to service_role using (true) with check (true);
create policy regulatory_licenses_service_role on public.regulatory_licenses for all to service_role using (true) with check (true);
create policy regulatory_inspections_service_role on public.regulatory_inspections for all to service_role using (true) with check (true);
create policy regulatory_compliance_actions_service_role on public.regulatory_compliance_actions for all to service_role using (true) with check (true);
create policy regulatory_status_events_service_role on public.regulatory_status_events for all to service_role using (true) with check (true);

revoke execute on function public.tia_record_membership_event() from public, anon, authenticated;
revoke execute on function public.tia_expire_memberships() from public, anon, authenticated;
revoke execute on function public.regulatory_mark_overdue_actions() from public, anon, authenticated;
revoke execute on function public.regulatory_expire_licenses() from public, anon, authenticated;
revoke execute on function public.regulatory_sync_operator_compliance() from public, anon, authenticated;
revoke execute on function analytics.refresh_daily_metrics(date) from public, anon, authenticated;

commit;
