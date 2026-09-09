# Offline channel API boundary

The offline channel service is intentionally not a direct database API. It consumes the same repository contracts as the governed public visitor service.

## Planned endpoints

`GET /api/v1/public/offline/provincial/{provinceCode}/manifest`

Returns a province-scoped `OfflineManifest` containing only published public records.

`GET /api/v1/public/offline/kiosk/manifest`

Returns a national kiosk `OfflineManifest` containing only published public records.

`GET /api/v1/public/handoff/{type}/{id}`

Resolves a QR handoff identifier into a public visitor route. Resolution must re-check publication state at request time.

These endpoints are specified here before server wiring so authentication, cache headers, signing, rate limits, and analytics can be designed as platform concerns rather than embedded in channel clients.
