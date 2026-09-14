# NTDP Release Acceptance Gates

This is the mandatory release gate for the Concept Note compliance baseline.

## Engineering gates

- [ ] `npm run test` passes with no failed tests.
- [ ] `npm run build` passes.
- [ ] `npm run build:server` passes.
- [ ] API smoke tests pass.
- [ ] Database migrations 0001 through latest apply cleanly in the target PostgreSQL/Supabase environment.
- [ ] Production identity and RBAC tests pass.
- [ ] Public/private publication boundary tests pass.
- [ ] Offline provincial and kiosk manifest tests pass.

## NTDP module gates

- [ ] Registry: authoritative operator/destination/content lifecycle.
- [ ] Warehouse: historical facts/snapshots, governed metrics and forecasting-ready model.
- [ ] GIS: PostGIS assets, spatial indexes, province boundaries/layers and public/private controls.
- [ ] SME: registration/profile, assessment, programme enrolment and outcome reporting.
- [ ] TIA Membership: application, approval, renewal, expiry, fee and reporting workflows.
- [ ] Regulatory: licensing, inspection, certification, compliance and audit workflows.
- [ ] Distribution: channel registry, publication queue, syndication and partner controls.
- [ ] Commerce: provider adapter, transaction lifecycle, webhook/idempotency and reconciliation controls.
- [ ] API Gateway: gateway/WAF, partner authentication, throttling, versioning and observability.

## Channel gates

- [ ] Website home/discovery accepted.
- [ ] Super App/PWA home/discovery accepted.
- [ ] Provincial portal home/discovery accepted.
- [ ] Kiosk home/discovery accepted.
- [ ] Third-party distribution contract and partner onboarding accepted.

## Operational gates

- [ ] Backup and restore test completed.
- [ ] Offline recovery/sync test completed.
- [ ] Monitoring and alerting configured.
- [ ] Security review completed.
- [ ] Data ownership and data-sharing arrangements approved.
- [ ] Capacity test demonstrates the initial 5,000-operator / approximately 50-staff-user sizing baseline.
