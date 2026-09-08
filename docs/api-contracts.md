# API Contract Baseline

## API principles

- Version public contracts under `/api/v1`.
- JSON request/response envelopes are consistent across services.
- Server-side authorization is mandatory; UI visibility is not authorization.
- Pagination is cursor-based for collections that may grow significantly.
- Mutating operations return the resulting resource representation or an explicit operation result.
- Validation errors use stable machine-readable codes.
- Correlation/request IDs are returned for troubleshooting and audit linkage.

## Response conventions

Success collection:
```json
{
  "data": [],
  "page": { "nextCursor": null }
}
```

Error:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": []
  },
  "requestId": "..."
}
```

## Initial resource groups

### Industry
- `GET /api/v1/operators`
- `GET /api/v1/operators/:id`
- `POST /api/v1/operators`
- `PATCH /api/v1/operators/:id`
- `GET /api/v1/operators/:id/registrations`
- `GET /api/v1/operators/:id/licences`
- `GET /api/v1/operators/:id/compliance`

### Destinations & content
- `GET /api/v1/provinces`
- `GET /api/v1/destinations`
- `GET /api/v1/destinations/:id`
- `GET /api/v1/experiences`
- `GET /api/v1/events`
- `GET /api/v1/content`

### Visitor
- `GET /api/v1/discovery/search`
- `POST /api/v1/itineraries`
- `PATCH /api/v1/itineraries/:id`
- `POST /api/v1/visitor-enquiries`
- `GET /api/v1/qr/:code`

### Intelligence
- `GET /api/v1/intelligence/metrics`
- `GET /api/v1/intelligence/observations`

## Authorization

Each endpoint declares required permissions. Public discovery endpoints are explicitly anonymous-safe. Administrative endpoints require authenticated identity and server-side RBAC evaluation.

## Compatibility

Breaking changes require a new API version. Additive fields should remain backward compatible. Deprecations must be documented before removal.
