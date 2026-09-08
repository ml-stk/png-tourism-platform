# ADR 0004: API and persistence adapters

## Decision

Keep the HTTP API and PostgreSQL implementation outside the domain layer. Services depend on repository contracts; PostgreSQL adapters implement those contracts. HTTP handlers authenticate, authorize, validate request shape, then invoke services.

## Rationale

This preserves testability, prevents database coupling in domain logic, and makes the identity provider and persistence engine replaceable without rewriting the business layer.

## Security boundary

Authorization is server-side and deny-by-default. Province and operator scope checks occur before data access or mutation. Regulatory mutations pass through audited services. Anonymous clients do not receive direct database access.
