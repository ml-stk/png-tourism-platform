# NTDP Requirements Traceability

## Source-to-platform matrix

| Source requirement | Repository evidence | Status |
|---|---|---|
| Authoritative National Tourism Registry | `db/migrations/0001_platform_foundation.sql`, operator/content services | Implemented |
| Tourism Data Warehouse | `db/migrations/0016_ntdp_enterprise_modules.sql`, `0019_ntdp_warehouse_maturation.sql`, governed facts/snapshots, metric definitions and ETL run audit | Baseline implemented; historical BI/forecasting expansion remains |
| Tourism GIS Platform | PostGIS `gis.tourism_geo_asset`, GIS API | Baseline implemented; authoritative layer/tooling expansion pending |
| Tourism SME Development | SME profiles, assessments, programmes/enrolments | Baseline implemented; workflow/reporting expansion pending |
| TIA Membership Management | `tia_memberships`, lifecycle API, membership event history | Lifecycle baseline implemented; reporting/UI remains |
| Regulatory & Compliance | operator lifecycle + compliance + licensing/inspection/actions | Baseline implemented; certification expansion remains |
| Marketplace & Distribution Hub | `distribution.channels`, `distribution.publications`, partner registry/bindings | Baseline implemented; syndication adapters pending |
| Payments & Commerce Readiness | `commerce.payment_providers`, `commerce.transactions` | Readiness baseline implemented |
| National Tourism API Gateway | versioned APIs + enterprise API boundary | Application API implemented; gateway control plane pending |
| Website | visitor interface and public APIs | Implemented foundation |
| Super App/PWA | PWA manifest, visitor services and responsive UI | Foundation implemented |
| Provincial portals | province scoping + offline provincial manifest | Foundation implemented |
| Kiosks | kiosk manifest + QR handoff | Foundation implemented |
| Approved third parties | distribution channel + partner onboarding boundary | Foundation implemented; live partner integration pending |
| Vision and scope documentation | `docs/vision-and-scope.md` | Complete baseline |
| Four visual design concepts | `docs/visual-design-prototypes.md` + common design system | Complete specification; visual acceptance remains UI gate |
| Solution architecture | `docs/solution-architecture.md` | Complete baseline |
| System flows | `docs/system-flows.md` | Complete baseline |
| Today vs Tomorrow | `docs/today-and-tomorrow.md` | Complete baseline |

## Warehouse baseline

The analytical boundary now contains operator snapshots, visitor-event facts, governed daily metric definitions, daily metric facts and ETL run audit records. A controlled refresh function populates registered, active, compliant and visitor-event metrics by day and province. Enterprise APIs expose metric retrieval, refresh and ETL-run status to authorised users.

This is a production-oriented warehouse foundation, not a claim that the full national data warehouse, BI estate or predictive forecasting layer is complete. Historical retention policy, production scheduling, BI dashboards, data quality rules and forecasting remain release gates.

## MVP scope boundary

The proposed MVP source explicitly states that its two-month deliverable is a design/architecture package and excludes software build and data migration. The repository has progressed beyond that design scope into implementation. This traceability document therefore distinguishes design-deliverable compliance from full Concept Note implementation compliance.

## Release acceptance gates

1. All automated tests pass.
2. TypeScript/Vite production build passes.
3. API smoke tests pass.
4. Database migrations apply cleanly to the target production PostgreSQL/Supabase environment.
5. Security tests pass, including authentication, RBAC and public/private boundary tests.
6. Module acceptance tests cover Registry, Warehouse, GIS, SME, TIA, Regulatory, Distribution, Commerce and API boundaries.
7. Four-channel UI acceptance targets are reviewed against the visual specification.
8. Backup/restore and offline recovery tests are completed before production go-live.
