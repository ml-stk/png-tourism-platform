# Public Offline and QR Delivery API

## Offline manifest

`GET /api/v1/public/offline/manifest?channel=provincial&province=ORO`

Returns a governed `OfflineManifest` containing only published destinations and published content. Provincial manifests require a valid province code and are province-scoped. Kiosk manifests are national and must not include a province filter.

The response includes `schemaVersion`, `generatedAt`, `channel`, optional `provinceCode`, record `version` values, record `updatedAt` timestamps, and `source: public-published-content`.

The endpoint is public read-only delivery. Normal API security headers and public rate limiting still apply.

## QR resolver

`GET /api/v1/public/qr/resolve?type=destination&id=<id>`

or

`GET /api/v1/public/qr/resolve?type=content&id=<id>`

The resolver first verifies that the target is publicly published. It then returns the versioned `QrHandoff` deep link plus a web `publicPath`. Unpublished, missing, or invalid targets are never exposed through the resolver.

QR resolution is intentionally read-only and does not bypass publication governance, authentication boundaries, or rate limits.
