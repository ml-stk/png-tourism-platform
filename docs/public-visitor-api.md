# Public Visitor API

The public visitor boundary is anonymous and read-only. It exposes only explicitly published destinations/content and a deliberately limited operator profile.

## Endpoints

- `GET /api/v1/public/destinations?province=NCD`
- `GET /api/v1/public/destinations/:id`
- `GET /api/v1/public/content?type=experience`
- `GET /api/v1/public/content/:id`
- `GET /api/v1/public/operators?province=NCD`
- `GET /api/v1/public/operators/:id`

## Governance

- Destinations must have `publicationStatus=published`.
- Content must have `publicationStatus=published`.
- Operators must be active, compliant, and have an explicit trading name.
- Legal name, compliance details, audit data, and other regulatory fields are never exposed by the public operator profile.
- Anonymous requests cannot access the authenticated `/api/v1` administrative routes.
- Public resources use the same application/repository boundary as internal services; there is no direct anonymous database access.
