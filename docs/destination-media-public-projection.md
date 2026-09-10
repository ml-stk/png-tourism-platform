# Destination Media and Public Content Projection v1

The destination projection is the governed visitor-facing read model for published destination content.

## Boundary

- Content Studio remains the editorial source of truth.
- Media assets store metadata only; binary upload/storage belongs behind a future object-storage adapter.
- Public projection queries require destination `published` status and only include linked content/media that are also `published`.
- Projection records expose `contentVersion`, freshness, provenance, QR path and an offline cache key.
- Visitor clients consume the projection; they do not access PostgreSQL directly.

## API

- `GET /api/v1/public/destinations`
- `GET /api/v1/public/destinations/:slug`
- `POST /api/v1/content-studio/media` for governed media metadata registration
- `POST /api/v1/content-studio/media/:id/publish` for publication with `content:publish`

The public API is intentionally read-only and does not expose drafts, review content, archived content or private media.
