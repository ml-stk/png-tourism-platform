# ADR 0003: Production identity and API security boundary

## Status
Accepted

## Decision
The production API requires a signed JWT bearer token using an explicitly configured HS256 secret. Development identity fallback remains available only when `NODE_ENV` is not `production`.

The API applies a small set of transport protections at the server boundary: security headers, request-body limits, request correlation IDs, and an in-process rate limit. These protections are deliberately kept behind a service boundary so they can later be replaced by an API gateway or distributed limiter without changing domain services.

JWT claims are reduced to the platform authorization context: subject, identity metadata, roles, province scopes, and operator scopes. Authorization continues to be enforced by the existing permission and resource-scope functions; token claims do not bypass those checks.

## Production configuration
- `AUTH_JWT_SECRET`: required in production.
- `REQUEST_BODY_MAX_BYTES`: optional, defaults to 1 MiB.
- `RATE_LIMIT_WINDOW_MS`: optional, defaults to 60 seconds.
- `RATE_LIMIT_MAX_REQUESTS`: optional, defaults to 120 requests per window per source address.

## Consequences
- Invalid, unsigned, expired, or incorrectly configured production tokens fail closed.
- Development credentials cannot accidentally become a production authentication mechanism.
- Rate limiting is process-local and is not sufficient as the final distributed production control; a gateway/shared limiter should replace it before horizontal scaling.
- HS256 is an adapter contract, not a permanent identity-provider decision. A future OIDC/JWKS adapter can implement the same authenticated-user boundary without changing domain authorization code.
