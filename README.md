# PNG Tourism Platform

Production-oriented national tourism digital platform for the Papua New Guinea Tourism Promotion Authority (PNGTPA).

## Current delivery scope

The repository now contains a runnable platform foundation with:

- Public PNG tourism visitor experience
- Destination discovery and published destination content
- Visitor journey planning and digital passport flows
- AI Concierge entry point
- Tourism industry discovery and operator workflows
- TPA Command Centre, content studio, campaign/event and tourism intelligence views
- Versioned API, identity/RBAC, audit and governed data services
- Supabase/PostgreSQL migrations and GitHub Actions CI/CD

The implementation is being aligned to the NTDP Concept Note and MVP direction: the National Tourism Registry remains the authoritative record, while visitor, industry, content, analytics and future channels consume governed platform services.

## Architecture principles

1. **Registry-first:** one authoritative tourism record reused by mapping, membership, licensing, distribution and reporting.
2. **API-first:** experience channels consume shared services rather than duplicating business rules.
3. **Security-by-design:** least privilege, server-side authorization, validation and auditability are mandatory.
4. **Offline-aware:** critical visitor and operator journeys must degrade gracefully when connectivity is poor.
5. **Usage-led delivery:** high-value visitor and authority workflows are prioritised; lower-frequency enterprise capabilities remain modular and progressively disclosed.
6. **Phased delivery:** the platform follows the Concept Note's four implementation horizons rather than attempting to expose every future capability at once.

## Local development

```bash
npm install
npm run test
npm run build
npm run build:server
```

## CI/CD

GitHub Actions runs the test suite, frontend build, server build and API smoke acceptance on pushes and pull requests. GitHub Pages publishes the public frontend from `main`.

## Project documentation

- `ARCHITECTURE.md` — target architecture and delivery sequence
- `docs/usage-redo-plan.md` — usage-led cleanup and acceptance gates
- `tests/` — automated and acceptance-oriented checks

## Source direction

The NTDP Concept Note defines the national platform vision, nine core modules, five experience channels and four implementation horizons. The proposed MVP explicitly limits the initial two-month deliverable to vision/scope, visual prototypes, solution architecture, system flows and today/tomorrow process views rather than a full software build.
