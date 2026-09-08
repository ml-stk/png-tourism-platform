# PNG Tourism Platform Architecture

## 1. Target platform

The platform is a shared digital foundation for TPA, tourism operators, provinces, visitors and partner organisations.

### Experience channels

- Public tourism web
- Mobile/PWA experience
- Airport and visitor-centre kiosks
- QR-enabled destination and campaign journeys
- Operator portal
- Provincial portal
- TPA regulatory/admin portal

### Core domains

- Identity and access
- Operator registry and licensing
- Visitor profiles and journeys
- Destinations and attractions
- Events and campaigns
- Content/media management
- Maps and geospatial data
- Itineraries and saved journeys
- Leads/referrals and partner ecosystem
- Compliance and inspections
- Tourism intelligence and reporting
- Notifications
- Audit and security

### Platform services

- Versioned REST API
- Persistent relational data layer
- Authentication and RBAC
- Audit/event trail
- File/media storage
- Search
- Background jobs
- Integration adapters
- Observability

## 2. Key architectural decisions

### Offline-first

Critical visitor and operator workflows must degrade gracefully when network connectivity is poor. The client should cache essential data and queue safe writes for synchronization.

### API-first

Experience channels must consume shared services rather than embedding business rules independently. This prevents divergence between web, mobile, kiosk and portals.

### AI-ready

AI Concierge and tourism intelligence capabilities will consume governed platform data through explicit service boundaries. AI must not become a separate source of truth.

### Security

Least privilege, strong authentication, server-side authorization, validation, auditability, secrets isolation and secure integration boundaries are mandatory design constraints.

## 3. Delivery approach

Build vertically in small increments:

1. Foundation and developer experience
2. Identity/RBAC and platform shell
3. Core tourism data model and APIs
4. Public visitor experience
5. Operator ecosystem
6. TPA command centre
7. Provincial/kiosk experiences
8. Analytics, integrations and AI services

Each increment should remain runnable and testable before the next domain is added.
