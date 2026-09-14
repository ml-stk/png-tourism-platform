-- Capacity baseline support: keep common administrative list paths indexed as NTDP
-- operator and staff populations scale toward the Concept Note baseline.
create index if not exists idx_tia_memberships_created_at on tia_memberships(created_at desc);
create index if not exists idx_regulatory_licenses_created_at on regulatory_licenses(created_at desc);
create index if not exists idx_regulatory_inspections_created_at on regulatory_inspections(created_at desc);
create index if not exists idx_regulatory_actions_created_at on regulatory_compliance_actions(created_at desc);
create index if not exists idx_distribution_publications_created_at on distribution.publications(created_at desc);
create index if not exists idx_distribution_publication_events_changed_at on distribution.publication_events(changed_at desc);
create index if not exists idx_distribution_partner_events_changed_at on distribution.partner_events(changed_at desc);
create index if not exists idx_sme_assessments_created_at on sme_assessments(assessed_at desc);
create index if not exists idx_sme_program_enrolments_created_at on sme_program_enrolments(enrolled_at desc);
create index if not exists idx_commerce_transactions_created_at on commerce.transactions(created_at desc);
create index if not exists idx_commerce_transaction_events_changed_at on commerce.transaction_events(changed_at desc);