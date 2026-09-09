# Public Offline and QR Delivery API

## Offline manifest

`GET /api/v1/public/offline/manifest?channel=provincial&province=ORO`

Returns only published destinations and content. Provincial manifests require a valid province and are province-scoped. Kiosk manifests are national and must not receive a province filter.

Each manifest carries a schema version, generation timestamp, channel, optional province, stable record versions, source update timestamps, and the governed source marker `public-published-content`.

## QR resolver

`GET /api/v1/public/qr/resolve?type=destination&id=<id>`

or

`GET /api/v1/public/qr/resolve?type=content&id=<id>`

Resolution first verifies that the target is publicly published. The response contains the `QrHandoff` deep link and the corresponding web `publicPath`. Missing or unpublished targets are not exposed.

Both endpoints are public read-only delivery and remain protected by the platform's security headers and rate limiting. They do not bypass publication governance or authenticated regulatory APIs.
