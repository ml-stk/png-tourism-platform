# NTDP Usage-Led Cleanup & Redo Plan

## Objective

Reduce platform complexity without reducing the NTDP's strategic capability. The public visitor journey and the TPA's highest-value operational workflows become the primary product surfaces; future enterprise modules remain available behind clear boundaries and phased delivery.

## Phase gates

### Phase 0 — Baseline / freeze
- Preserve `main` as the production baseline.
- Record the current CI/CD state and known architectural constraints.
- No production branch mutation until the cleanup branch is validated.

**Approval gate:** baseline reproducible and CI green.

### Phase 1 — Repository and architecture hygiene
- Remove obsolete GitLab-only CI artefacts now that GitHub Actions is authoritative.
- Refresh repository documentation so it reflects the actual running platform.
- Establish explicit acceptance criteria and ownership boundaries.

**Approval gate:** no obsolete delivery path remains; documentation matches the implementation.

### Phase 2 — Visitor experience simplification
Prioritise the journeys with direct visitor value:
1. Discover destinations
2. Discover experiences/operators
3. Plan a trip
4. Use AI Concierge

Digital Passport remains available but is treated as a supporting journey rather than a competing primary navigation path.

**Acceptance:** clear CTA hierarchy, dark visual system, readable form controls, mobile-safe navigation, stable hero/destination imagery and no dead primary links.

### Phase 3 — Authority workspace simplification
- Keep Command Centre, Industry Ecosystem, Destinations/Content, Campaigns/Events and Tourism Intelligence as explicit workspaces.
- Reduce repeated explanatory UI and surface governed status/empty states consistently.
- Keep regulatory mutations behind authenticated authority roles.

**Acceptance:** each workspace has one obvious purpose and protected operations remain protected.

### Phase 4 — Data/API and security cleanup
- Remove duplicate client-side business rules where shared services already exist.
- Verify public endpoints expose only published records.
- Verify protected intelligence/regulatory operations require the intended identity and role checks.
- Retain auditability for sensitive lifecycle actions.

**Acceptance:** CI, API smoke and gateway acceptance all pass; no legacy auth fallback is reintroduced.

### Phase 5 — Quality and release acceptance
- Expand regression coverage around visitor navigation and high-value workflows.
- Run full CI, API smoke and gateway smoke.
- Validate the production Pages build from `main` after merge.
- Record release evidence and residual risks.

**Release gate:** all automated checks green and manual acceptance checklist complete.

## Non-goals

- Do not delete NTDP strategic modules merely because their usage is currently low.
- Do not implement payment processing, predictive AI or cross-agency integrations ahead of their stated roadmap phase.
- Do not bypass server-side authorization for convenience.
- Do not replace authoritative tourism data with static frontend copies except as deliberate, published snapshots for resilient visitor delivery.
