# Production security boundary

## Authentication

Production requests use `Authorization: Bearer <JWT>`. The server verifies HS256 signatures using `AUTH_JWT_SECRET`, validates the token subject, and rejects expired tokens. Roles, province scopes, and operator scopes are read from verified claims and passed into the existing authorization layer.

Development identity fallback is disabled when `NODE_ENV=production`.

## Request protection

The API applies:

- correlation IDs through `x-request-id`
- `nosniff`, `DENY` framing, restrictive referrer and permissions policies
- HSTS in production
- a configurable request body limit
- an in-process per-source rate limit

The in-process limiter is an interim protection. Before horizontal scaling, replace it with a shared gateway or distributed limiter.

## Secret handling

`AUTH_JWT_SECRET` must be supplied through deployment secret management. It must not be committed to the repository. `.env.production.example` contains only placeholders.

## Future identity adapter

The current JWT adapter is intentionally isolated. A future OIDC/JWKS provider can replace signature verification while preserving the `AuthenticatedUser` and authorization contracts.
