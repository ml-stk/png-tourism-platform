# NTDP Requirements & Acceptance Matrix

**Status:** Baseline assessment  
**Source basis:** PNGTPA National Tourism Digital Platform Concept Note; Proposed Minimum Viable Product — National Tourism Digital Platform  
**Repository:** `ml-stk/png-tourism-platform`

## 1. Assessment categories

- **Implemented** — materially represented in the current production code and suitable for acceptance testing.
- **Partial** — a working foundation exists, but the source requirement is not yet fully delivered.
- **Missing** — no material production implementation identified.
- **Phase 2** — roadmap capability scheduled after the initial foundation.
- **Phase 3** — roadmap capability scheduled for months 13–18.
- **Phase 4** — roadmap capability scheduled for month 19+.
- **MVP design only** — required by the two-month MVP as a concept/design deliverable, not as software.

## 2. Channel acceptance

| Requirement | Current assessment | Acceptance action |
|---|---|---|
| PNG Tourism Website | Implemented | Complete browser/mobile acceptance, accessibility and performance testing |
| PNG Tourism Super App | MVP design only / Phase 3 | Define shared channel contract now; production app follows API/platform foundation |
| Provincial Tourism Portals | MVP design only / Phase 2–3 | Define provincial tenancy/content model and pilot node |
| Tourism Information Kiosks | MVP design only / later implementation | Define kiosk mode, offline/cache behaviour, device profile and deployment model |
| Approved Third-Party Platforms | Missing / Phase 3 | Implement public API gateway and distribution controls |

## 3. Nine core platform modules

| Module | Current assessment | Next action |
|---|---|---|
| National Tourism Registry | Partial | Complete authoritative operator/attraction/product/service model, lifecycle, governance and migration plan |
| Tourism Data Warehouse | Partial | Establish warehouse/analytics data model and ingestion/reporting pipelines |
| Tourism GIS Platform | Partial | Establish authoritative geospatial model and baseline map layer |
| Tourism SME Development Platform | Partial | Complete SME registration, tracking and development assessment workflows |
| TIA Membership Management | Partial | Implement membership application, renewal, fees/status and reporting workflow |
| Regulatory & Compliance Framework | Partial | Complete licensing, inspections, certification, compliance and audit workflows |
| Tourism Marketplace & Distribution Hub | Partial | Formalize publish/distribution model and channel controls |
| Tourism Payments & Commerce Readiness | Phase 4 / readiness | Define commerce abstraction and integration boundary; do not couple to one provider prematurely |
| National Tourism API Gateway | Partial / high priority | Harden public API surface, authentication, rate limits, versioning, observability and partner access |

## 4. Authority workflows

| Requirement | Current assessment | Next action |
|---|---|---|
| Operator registration | Partial / Implemented foundation | Validate end-to-end submission, review, approval and registry publication |
| Membership application/renewal | Missing/Partial | Implement governed workflow and audit evidence |
| Licensing | Partial | Complete approval states, documents, expiry/renewal and staff workflow |
| Compliance/inspection | Partial | Complete inspection, certification, audit and remediation lifecycle |
| Registry-to-reporting | Partial | Connect authoritative records to analytics/reporting model |
| Distribution to outside channels | Partial | Implement governed API/distribution contracts |

## 5. Visitor capabilities

| Requirement | Current assessment | Acceptance action |
|---|---|---|
| Trusted destination information | Implemented | Validate live API + governed snapshot fallback |
| Destination exploration | Implemented | Test all destination cards/detail paths and mobile layouts |
| Trip planning | Implemented | Test create/edit/remove/reload flows and failure states |
| AI Concierge | Implemented | Test representative prompts, error handling and safe responses |
| Industry discovery | Implemented/Partial | Validate published operator filtering and enquiry journey |
| Digital Passport | Implemented/Partial | Validate persistence, UX and future identity integration boundary |

## 6. Intelligence, governance and integration

| Requirement | Current assessment | Next action |
|---|---|---|
| Analytics dashboard | Partial | Replace/augment presentation placeholders with governed metrics |
| Provincial analytics | Missing/Phase 2 | Define provincial aggregation and access controls |
| Regulatory reporting | Partial | Define report catalogue and evidence/audit requirements |
| Data governance | Partial | Establish ownership, publication status, provenance, retention and audit model |
| Cross-agency integration | Phase 4 | Define integration contracts and data-sharing prerequisites |
| Predictive AI | Phase 4 | Defer until sufficient governed data exists |
| Global payments | Phase 4 | Defer implementation; maintain commerce-ready boundary |

## 7. Non-functional acceptance

| Requirement | Current assessment | Next action |
|---|---|---|
| Initial sizing: 5,000 operators / ~50 staff | Not yet load-validated | Establish performance/load acceptance targets and test environment |
| PNG connectivity constraints | Partial | Validate low-bandwidth behaviour, caching and resilient fallbacks |
| Availability/backup | Partial | Define production SLOs, backup/restore and disaster recovery tests |
| Security/access control | Partial | Perform formal application/API/security review |
| Observability | Partial | Add structured logging, health checks, metrics and alerting |
| CI/CD | Implemented | Harden with deterministic dependency installation and release gates |

## 8. MVP deliverables versus production

The source MVP explicitly scoped the two-month work as vision/scope documentation, four visual channel concepts, high-level solution architecture, system-flow diagrams and a current-versus-future operating view. It explicitly excluded software build and data migration. Therefore the absence of production Super App and Kiosk software is **not an MVP failure**; they are future implementation work.

## 9. Execution priority

1. Production website acceptance and defect closure.
2. Authoritative Registry and API contract hardening.
3. Complete Authority workflows: registration, membership, licensing and compliance.
4. Data Warehouse/GIS/analytics foundations.
5. Public API Gateway and distribution controls.
6. Define shared channel contract and channel SDK/data models.
7. Super App production implementation (Phase 3 target).
8. Kiosk production mode, offline/resilient delivery and deployment profile.
9. Provincial portal pilot and expansion.
10. Third-party distribution, predictive AI and payment/cross-agency integrations according to roadmap.
