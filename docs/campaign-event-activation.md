# Campaign and Event Activation v1

Campaigns and events are governed content activations stored through the existing `ContentRepository` and `ContentService` boundary. PostgreSQL remains the persistence implementation; the visitor UI never accesses storage directly.

## Lifecycle

`draft -> review -> published -> archived` is the publication lifecycle. Publication requires the content item to be in review. Events additionally require a valid future end time. Campaigns must reference at least one already-published content item.

## API

Public:
- `GET /api/v1/public/events?province=NCD`
- `GET /api/v1/public/campaigns?province=NCD`

Protected:
- `GET /api/v1/events`
- `GET /api/v1/campaigns`
- `POST /api/v1/events`
- `POST /api/v1/campaigns`
- `POST /api/v1/events/:id/publish`
- `POST /api/v1/campaigns/:id/publish`
- `POST /api/v1/events/:id/status`
- `POST /api/v1/campaigns/:id/status`

Protected operations require the existing `content:read` or `content:write` permissions and server-side province access checks.

## Governance

Public endpoints expose only published activation summaries. Campaign links are restricted to published content. Visitor counts are not inferred from campaign/event activity; approved engagement telemetry remains the only visitor-signal input to intelligence.

QR/deep-link consumers can use the stable activation IDs with the existing public content/QR boundary. Audit records are written through the existing audit repository for create and publication operations.
