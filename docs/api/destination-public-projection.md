# Destination Public Projection API

## `GET /api/v1/public/destinations`

Returns published destinations, optionally filtered by `province`. Each item includes its content version, freshness state, published-only media, QR path, offline cache key and provenance.

## `GET /api/v1/public/destinations/:slug`

Returns one published destination projection by slug. Missing or unpublished destinations return `404`.

The API is visitor-safe by construction: editorial status filtering occurs in the repository query, before data reaches the public response.
