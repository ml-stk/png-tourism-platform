# Phase 6 — Offline provincial and kiosk channels

## Goal
Provide a governed offline delivery foundation for provincial and kiosk channels without creating a second content source of truth.

## Channel model

- **Provincial:** province-scoped offline manifests containing explicitly published destinations and public content. A province is mandatory.
- **Kiosk:** a national offline manifest for visitor discovery, suitable for airport and other fixed installations.
- Both channels consume the public publication boundary. They do not read regulatory records directly.

## Offline manifest

`OfflineService.buildManifest()` produces a versioned manifest with:

- schema version
- generation timestamp
- channel and optional province
- published destination/content records
- source declaration (`public-published-content`)

The manifest is a transport/cache contract, not a database snapshot. Later sync infrastructure can add checksums, ETags, deltas and background reconciliation without changing channel semantics.

## Sync health

The client distinguishes `never_synced`, `fresh`, `stale`, and `offline`. Stale data remains usable when offline; the UI must make its age visible rather than silently presenting cached information as current.

The initial stale threshold is 24 hours and is configurable by the service caller.

## QR handoff

QR handoff uses a stable `pngtourism://handoff/{type}/{id}` URI. The URI contains no regulatory attributes or private operator data. A future public web/mobile resolver can translate the handoff into a destination/content route and preserve attribution and analytics.

## Service-worker foundation

The web application now has an installable PWA manifest and a minimal app-shell service worker. This is intentionally a foundation rather than a final offline cache strategy: content manifests should be cached through explicit versioned sync logic instead of relying on uncontrolled browser cache growth.

## Next hardening steps

1. Add authenticated manifest endpoints and signed/versioned manifests.
2. Add IndexedDB storage with atomic manifest replacement and rollback.
3. Add delta sync, retry/backoff and connectivity-aware scheduling.
4. Add QR resolver endpoints and scan attribution.
5. Add kiosk device registration, configuration and remote health telemetry.
6. Add provincial channel UI with stale/sync status and explicit offline mode.
