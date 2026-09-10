# ADR 0013 — Destination public projection

## Decision

Use a dedicated governed read model for visitor destination pages rather than exposing Content Studio persistence directly.

## Rationale

This keeps publication state, media filtering, version/freshness metadata, QR references and offline cache identity in one server-side boundary. It also gives AI, offline and visitor clients a stable contract without granting direct database access.
