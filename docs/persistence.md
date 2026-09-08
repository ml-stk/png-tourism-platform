# Persistence Strategy

## Initial approach

Use PostgreSQL as the durable system of record. The application is structured as a modular monolith with repository interfaces so persistence technology does not leak into domain services.

The initial schema covers:

- provinces
- operators
- users
- roles and permissions
- user role/resource scopes
- destinations
- content items
- audit events

## Integrity rules

- Primary keys are UUIDs generated server-side.
- Province codes are referenced rather than duplicated as free-form values.
- Operator status and compliance status use constrained enums.
- Published content is explicitly represented.
- Audit events are append-oriented and indexed for target and actor history.
- User role assignments can carry province or operator scope.

## Application boundary

Services depend on repository interfaces in `src/persistence/repositories.ts`. PostgreSQL/Supabase adapters should implement those interfaces without changing domain contracts.

## Migration policy

Migrations are forward-only, reviewed, and applied in order. Destructive schema changes require an explicit migration plan and data-retention assessment.
