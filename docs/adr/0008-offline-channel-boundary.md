# ADR 0008: Offline channel boundary

## Status
Accepted

## Context
Provincial portals and fixed visitor kiosks must remain useful during unreliable connectivity. They must not become alternative authoritative data stores or expose unpublished/regulatory records.

## Decision
Offline clients receive versioned manifests generated from the governed public publication boundary. Provincial manifests are province-scoped; kiosk manifests may be national. Cached content is explicitly marked with sync health and age. QR handoffs contain only public resource identifiers.

The service-worker cache is limited to the application shell. Tourism content will use an explicit manifest/sync store so stale data can be inspected, replaced atomically and reconciled later.

## Consequences
- Offline delivery has one governed source of truth.
- Stale content can remain available without being represented as live.
- Sync and device management can evolve independently of content authoring.
- Kiosk/device telemetry and manifest signing remain future platform-service concerns.
