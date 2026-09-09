# Tourism Intelligence API

Authenticated endpoints require `intelligence:read`.

- `GET /api/v1/intelligence/snapshot?period=month`
- `GET /api/v1/intelligence/provinces?period=month`
- `GET /api/v1/intelligence/report?period=month`

Supported periods: `day`, `week`, `month`, `quarter`, `year`.

Responses include request correlation via `x-request-id`. Reports identify their governed source and generation time. Visitor traffic remains `0` until a real approved telemetry source is integrated; no synthetic visitor counts are generated.
