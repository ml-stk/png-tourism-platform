# National Tourism Digital Platform — Compliance Baseline

This baseline is derived from the PNG Tourism Promotion Authority Concept Note — National Tourism Digital Platform and Proposed Minimum Viable Product — National Tourism Digital Platform.

## Nine-module compliance baseline

| # | Concept Note module | Current platform baseline | Acceptance direction |
|---|---|---|---|
| 1 | National Tourism Registry | Implemented: operators, destinations, content, lifecycle, publication and audit | Authoritative master record; governed publication boundary |
| 2 | Tourism Data Warehouse | Baseline introduced: analytics schema, operator snapshots, visitor-event facts and metric facts | Expand into governed historical warehouse/ETL and forecasting layer |
| 3 | Tourism GIS Platform | Baseline introduced: PostGIS tourism geospatial assets, province scoping and public flag | Add authoritative layers, spatial APIs and operational GIS tooling |
| 4 | Tourism SME Development Platform | Baseline introduced: SME profiles, assessments, programmes and enrolments | Add complete programme administration, outcome tracking and reporting |
| 5 | TIA Membership Management | Baseline introduced: applications, renewals, expiry, fees and status | Add approval workflow, renewal notices and membership reporting |
| 6 | Regulatory & Compliance Framework | Implemented: registration, approval/rejection, compliance, suspension, closure and audit | Extend licensing, inspection and certification workflows |
| 7 | Tourism Marketplace & Distribution Hub | Baseline introduced: governed channels and publication queue | Add product catalogue, syndication adapters and partner management |
| 8 | Tourism Payments & Commerce Readiness Framework | Baseline introduced: provider registry and transaction abstraction | Add provider adapters, webhooks, reconciliation and settlement controls |
| 9 | National Tourism API Gateway | Versioned API foundation exists; enterprise endpoints are permissioned | Add gateway/WAF, partner credentials, throttling and API product governance |

## Five channel baseline

1. PNG Tourism Super App
2. PNG Tourism Website
3. Provincial Tourism Portals
4. Tourism Information Kiosks
5. Approved Third-Party Tourism Platforms

Channels consume shared services and a governed public publication boundary; they do not become separate sources of truth.

## Phase alignment

| Concept Note phase | Roadmap intent | Platform delivery stance |
|---|---|---|
| Phase 1, months 1–6 | Registry core, licensing workflows, warehouse build, baseline GIS | Registry/regulatory foundation complete; warehouse/GIS foundations explicit |
| Phase 2, months 7–12 | SME/TIA, analytics, provincial pilot, compliance audit tools | SME/TIA foundations added; analytics and provincial/offline capabilities in progress |
| Phase 3, months 13–18 | Super App, public API gateway, B2B distribution, live consumer portal | Channel and distribution contracts established; gateway/distribution hardening remains |
| Phase 4, month 19+ | Predictive AI, payments, cross-agency hooks, optimisation | AI governance and commerce readiness established; production integrations remain future work |

## Governance principles

- The Registry remains the authoritative source for governed tourism records.
- Regulatory/private records are not exposed through anonymous public APIs.
- Public content is explicitly published; registration alone does not publish private records.
- Provincial and kiosk channels consume governed public manifests rather than maintaining alternative authoritative datasets.
- AI is constrained by policy, audit and publication boundaries.
- Payment credentials are never stored in repository configuration; provider secrets belong in an external secret manager.
- Enterprise endpoints require explicit server-side permissions.

## Capacity baseline

The proposed MVP sizes the platform for up to 5,000 operators and approximately 50 Authority staff users at start. Production capacity, resilience and recovery testing remain release gates.

## Current acceptance blockers

1. CI must be green on `main` before release acceptance.
2. The analytical baseline must evolve into a governed warehouse with historical retention and forecasting-ready datasets.
3. GIS, membership, distribution and commerce modules require full workflow/UI coverage before being marked complete.
4. The API gateway requires an actual gateway control plane rather than only application-level REST endpoints.
5. Formal MVP documentation must remain versioned with the implementation.
