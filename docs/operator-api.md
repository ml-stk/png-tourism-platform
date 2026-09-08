# Operator API and persistence boundary

The operator lifecycle is exposed through `/api/v1` and is backed by PostgreSQL repositories.

## Routes

- `GET /api/v1/operators` — authenticated, `operator:read`; optional `province` filter is province-scoped.
- `GET /api/v1/operators/:id` — authenticated, `operator:read`; resource-scoped to the operator unless the caller is a platform administrator or TPA regulator.
- `POST /api/v1/operators` — authenticated, `operator:register`; province scope is enforced before registration.
- `GET /api/v1/provinces` — read-only reference data.

Every response includes a request ID. Regulatory mutations are audited through the service boundary.

## Authentication

The current adapter accepts a bearer subject for development and constructs a development identity from environment variables. Production deployment must replace this adapter with the selected identity provider and must not rely on development defaults.

## Persistence

`Postgres*Repository` implementations satisfy the service contracts and use parameterized SQL. The API does not expose database tables directly to clients.
