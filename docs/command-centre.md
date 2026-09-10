# TPA Command Centre v1

The Command Centre provides an operational view over governed platform data and approved visitor engagement telemetry.

## API

`GET /api/v1/command-centre/report?period=month&province=NCD`

Supported periods: `day`, `week`, `month`, `quarter`, `year`.

The endpoint requires `intelligence:read`. Province filtering is enforced against the authenticated user's province scope.

## Data boundary

The Command Centre consumes domain services and repository adapters. Frontend code does not access PostgreSQL directly.

Visitor engagement is limited to approved event types and aggregate counts. No visitor message, private operator data, regulatory records, or uncontrolled AI data is exposed through the dashboard.

## Visitor counts

`visitors` remains zero until an approved visitor-count source is integrated. Engagement signals are reported separately and must not be interpreted as unique visitors.

## Freshness and provenance

Every report carries generation metadata and governed source indicators so operational users can distinguish platform aggregates from visitor engagement telemetry.
