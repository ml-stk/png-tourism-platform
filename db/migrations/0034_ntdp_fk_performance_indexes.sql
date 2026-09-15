-- NTDP foreign-key performance indexes
-- Covers previously uncovered FK columns identified during production security/performance review.

create index if not exists idx_regulatory_actions_created_by on public.regulatory_compliance_actions(created_by);
create index if not exists idx_regulatory_actions_inspection on public.regulatory_compliance_actions(inspection_id);
create index if not exists idx_regulatory_actions_license on public.regulatory_compliance_actions(license_id);
create index if not exists idx_regulatory_inspections_inspector on public.regulatory_inspections(inspector_id);
create index if not exists idx_regulatory_inspections_operator on public.regulatory_inspections(operator_id);
create index if not exists idx_regulatory_licenses_reviewed_by on public.regulatory_licenses(reviewed_by);
create index if not exists idx_regulatory_status_events_changed_by on public.regulatory_status_events(changed_by);
create index if not exists idx_sme_assessments_assessor on public.sme_assessments(assessor_id);
create index if not exists idx_sme_assessments_sme on public.sme_assessments(sme_id);
create index if not exists idx_sme_program_enrolments_program on public.sme_program_enrolments(program_id);
create index if not exists idx_tia_membership_events_changed_by on public.tia_membership_events(changed_by);
create index if not exists idx_tia_memberships_renewal_of on public.tia_memberships(renewal_of);
