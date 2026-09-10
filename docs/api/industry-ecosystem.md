# Industry Ecosystem API

The Industry Ecosystem API exposes governed public discovery, operator-scoped profile and experience management, and visitor lead capture.

## Public discovery

- `GET /api/v1/industry/profiles?province=<PROVINCE>` — published industry profiles only.
- `GET /api/v1/industry/experiences?province=<PROVINCE>&destination=<ID>` — published experiences only.
- `POST /api/v1/industry/leads` — creates a visitor, QR, or referral lead. If an experience is supplied, it must be published and belong to the target operator.

## Operator routes

Authenticated routes use the existing `operator:read` permission and operator/province resource scoping.

- `GET /api/v1/industry/profiles/:operatorId`
- `PUT /api/v1/industry/profiles/:operatorId`
- `GET /api/v1/industry/experiences/:experienceId`
- `PUT /api/v1/industry/experiences/:experienceId`
- `GET /api/v1/industry/leads?operatorId=<ID>`

Experience publication remains governed: operators may maintain draft/submitted/suspended states, while the existing content publication workflow remains the authoritative publication path for governed public content.

No regulatory operator fields are exposed through these routes.