# NTDP Requirements Traceability

## Concept Note to platform baseline

| Concept Note module / channel | Current repository position | Remaining acceptance work |
|---|---|---|
| National Tourism Registry | Implemented with persistent operator lifecycle, audit and compliance state | Production data governance and migration validation |
| Tourism Data Warehouse | Baseline implemented with governed snapshots, facts, metric definitions and ETL audit | Full historical BI, forecasting and production scheduler |
| Tourism GIS Platform | **Matured baseline**: PostGIS asset store, governed layer catalogue, registry/destination synchronisation, province filters and GeoJSON API | Boundary/polygon layers, richer GIS tooling and authoritative source-data onboarding |
| Tourism SME Development Platform | Baseline implemented: profiles, assessments and development-program persistence | Full programme workflow, reporting and UI |
| TIA Membership Management | Lifecycle baseline implemented: applications, activation/suspension/cancellation, renewals, expiry and event history | Production reporting/UI and actor attribution hardening |
| Regulatory & Compliance Framework | Baseline implemented: licences, reviews, inspections and compliance actions | Certification workflow and reporting expansion |
| Tourism Marketplace & Distribution Hub | Baseline implemented: five channels, publication queue, partner registry and channel bindings | Live syndication adapters and partner certification |
| Tourism Payments & Commerce Readiness Framework | Baseline implemented: provider-neutral readiness and transaction model | Live provider adapters, signed webhooks and reconciliation |
| National Tourism API Gateway | Versioned authenticated application API boundary implemented | True gateway control plane: consumer registration, keys/OAuth, quotas, policy and gateway analytics |
| PNG Tourism Website | Foundation implemented | Production content/acceptance hardening |
| PNG Tourism Super App | PWA/offline foundation implemented | Full app feature set and release acceptance |
| Provincial Tourism Portals | Provincial foundation and scoped access implemented | Provincial content/workflow expansion |
| Tourism Information Kiosks | Offline/kiosk foundation implemented | Hardware/deployment acceptance |
| Approved Third-Party Tourism Platforms | Partner/channel foundation implemented | Live partner integrations |

## GIS baseline

The GIS baseline now provides a governed layer catalogue with authoritative-source metadata and a PostGIS-backed tourism asset store. Registry operators and destinations with valid coordinates can be synchronised into the GIS asset store through a controlled database function. Enterprise GIS access supports province and layer filtering, while the GeoJSON endpoint exposes only assets marked public and scoped as public.

The implementation intentionally does not claim the complete GIS platform: boundary polygons, comprehensive thematic layers, external authoritative geospatial datasets and advanced GIS tooling remain release work.

## MVP scope boundary

The Proposed Minimum Viable Product document describes a two-month design and architecture package rather than a production software build and excludes data migration. This repository has deliberately progressed beyond that design baseline into implementation. Production acceptance therefore remains subject to the release gates covering migration application, security, capacity, data governance, backup/recovery and channel validation.
