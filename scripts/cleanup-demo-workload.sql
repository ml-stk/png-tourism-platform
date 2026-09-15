-- Removes only records created by the NTDP synthetic evaluation workload.
-- Review before execution in any environment.

begin;

delete from gateway.request_log where request_id like 'demo-req-%';
delete from gateway.api_keys where key_prefix like 'ntdp_demo_%';
delete from gateway.api_clients where name like 'NTDP Demo Client %';

delete from public.visitor_leads where visitor_message like 'Synthetic visitor enquiry for evaluation%';
delete from public.visitor_engagement_events where (metadata->>'demo') = 'true';
delete from public.regulatory_compliance_actions where notes like 'Synthetic NTDP evaluation%';
delete from public.regulatory_inspections where operator_id in (select id from public.operators where legal_name like 'NTDP DEMO OPERATOR %');
delete from public.regulatory_licenses where license_number like 'DEMO-LIC-%';
delete from public.tia_memberships where membership_number like 'DEMO-TIA-%';
delete from public.sme_program_enrolments where sme_id in (select id from public.sme_profiles where operator_id in (select id from public.operators where legal_name like 'NTDP DEMO OPERATOR %'));
delete from public.sme_assessments where sme_id in (select id from public.sme_profiles where operator_id in (select id from public.operators where legal_name like 'NTDP DEMO OPERATOR %'));
delete from public.sme_profiles where operator_id in (select id from public.operators where legal_name like 'NTDP DEMO OPERATOR %');
delete from public.industry_experiences where summary like 'Synthetic demo experience%';
delete from public.industry_profiles where description like 'Synthetic evaluation profile%';
delete from public.content_items where slug like 'ntdp-demo-%';
delete from public.user_roles where user_id in (select id from public.users where external_subject like 'ntdp-demo-user-%');
delete from public.users where external_subject like 'ntdp-demo-user-%';
delete from public.operators where legal_name like 'NTDP DEMO OPERATOR %';

-- Demo-only province rows can be removed only if no non-demo data references them.
-- Destination rows are intentionally NOT removed here because some were pre-existing production records.

commit;
