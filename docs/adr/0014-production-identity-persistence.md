# ADR 0014 — Production identity persistence

## Decision

Production API requests continue to authenticate with the configured external identity provider and HS256 bearer-token verification. After token verification, the API resolves the external subject to a durable internal `users` record.

The internal user ID is used as the actor identity for regulated audit events. The account is rejected when its persisted `users.is_active` flag is false.

Trusted role claims are persisted to `user_roles` as an identity projection. They are not accepted from anonymous requests, and the external token remains cryptographically verified before any authorization check.

## Boundary

- The external IdP remains responsible for authentication and token issuance.
- The platform database owns durable internal actor identity and local account activation state.
- Authorization remains enforced by the platform permission model and scoped province/operator checks.
- Secrets are supplied through deployment configuration and are never stored in the repository.

## Follow-on

A future TPA administration surface can manage persisted user activation and role assignments. That work must not weaken external authentication or permit client-controlled privilege escalation.
