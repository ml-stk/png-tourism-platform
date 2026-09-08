# ADR 0003: Identity, RBAC and durable persistence

## Status

Accepted

## Decision

Use PostgreSQL as the durable platform data store and an external identity provider for authentication. Keep application authorization in the platform service layer using explicit roles, permissions, and resource scope.

## Rationale

The platform contains regulatory data, public tourism content, provincial operations, operator self-service, analytics, and future AI tooling. These domains require durable transactional integrity and auditable authorization decisions.

A repository abstraction prevents the domain from becoming coupled to a specific database provider. The PostgreSQL migration provides the initial physical model while adapters remain replaceable.

Authentication is deliberately outside the domain model. The platform maps verified IdP claims to an internal `AuthenticatedUser`; the browser cannot self-assign roles or scopes.

## Consequences

- PostgreSQL is the initial system of record.
- RBAC is centrally enforced at service/API boundaries.
- Province/operator scopes are explicit authorization context.
- Security-sensitive mutations can be audited consistently.
- A managed PostgreSQL provider may be used without changing domain contracts.
- Future identity-provider changes do not require domain changes.
