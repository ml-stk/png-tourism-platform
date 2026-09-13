# NTDP Requirements Traceability

## Source-to-platform matrix

| Source requirement | Repository evidence | Status |
|---|---|---|
| Authoritative National Tourism Registry | `db/migrations/0001_platform_foundation.sql`, operator/content services | Implemented |
| Tourism Data Warehouse | `db/migrations/0016_ntdp_enterprise_modules.sql`, `NtdpCoreService` | Baseline implemented; warehouse maturation pending |
| Tourism GIS Platform | PostGIS `gis.tourism_geo_asset`, GIS API | Baseline implemented; layer/tooling expansion pending |
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
