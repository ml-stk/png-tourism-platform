# Industry API integration

Planned routes:

- `GET /api/v1/industry/profiles` — published public profiles, optionally province-scoped.
- `GET /api/v1/industry/experiences` — published experiences, optionally province/destination-scoped.
- `GET /api/v1/industry/profile` — authenticated operator's profile.
- `PUT /api/v1/industry/profile` — authenticated operator mutation with optimistic versioning.
- `POST /api/v1/industry/experiences` — authenticated operator draft/submission mutation.
- `POST /api/v1/leads` — visitor/referral lead handoff to an active operator.
- `GET /api/v1/operator/leads` — operator-scoped lead retrieval.

All routes must use existing request IDs, validation, RBAC/resource scoping, public/regulatory separation, and audit requirements. Public routes must execute before authentication only where they are strictly read-only published views.
