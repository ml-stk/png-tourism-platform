# Identity and RBAC

## Boundary

Authentication establishes **who** the caller is. Authorization establishes **what** that identity may do. Business services must never infer authorization from UI state, route names, or client-supplied role claims.

The platform uses role-based permissions with optional resource scope:

- `platform_admin`: unrestricted platform administration.
- `tpa_regulator`: regulatory operator lifecycle and compliance.
- `content_manager`: tourism content authoring and publication.
- `provincial_admin`: province-scoped administration.
- `operator`: operator self-service scope.
- `analyst`: intelligence/reporting read access.

## Resource scoping

Roles alone are insufficient for provincial and operator workflows. Authorization context may carry:

- `provinceCodes` for province-scoped access.
- `operatorIds` for operator self-service access.

Regulatory users are not constrained by province scope by default because their responsibility is national. Provincial and operator access is explicitly constrained.

## Authentication adapter

The repository contains an in-memory identity adapter for development/tests. Production authentication must be delegated to an approved identity provider and mapped into `AuthenticatedUser` server-side.

The browser must not be trusted to declare its own roles, permissions, province scope, or operator scope.

## Security requirements

1. Deny by default.
2. Enforce authorization at the service/API boundary.
3. Validate every externally supplied identifier and payload.
4. Never expose regulatory tables directly to anonymous/public clients.
5. Record security-sensitive mutations in the audit trail.
6. Preserve request/correlation IDs through service and audit operations.
7. Keep authentication secrets and tokens out of source control and client bundles.

## Persistence

`db/migrations/0001_platform_foundation.sql` defines the PostgreSQL-compatible baseline. It is intentionally compatible with managed PostgreSQL platforms such as Supabase, while application services remain persistence-provider agnostic through repository interfaces.

Public tourism content is separate from regulatory operator records. Publication is an explicit application action rather than a side effect of operator activation.
