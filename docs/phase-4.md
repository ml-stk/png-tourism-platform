# Phase 4 — Destination & Content Management

This phase establishes the governed content layer between TPA-managed regulatory data and visitor channels.

## Delivered

- Persistent destination repository with province filtering.
- Destination create/read and controlled publication lifecycle.
- Content repository with type/status filtering and optimistic version updates.
- Content draft creation and explicit review-to-published gate.
- Server-side `content:read`, `content:write`, and `content:publish` authorization.
- Province scope enforcement for destination administration.
- Audit events for content and destination mutations.
- PostgreSQL migration for content body, summary, publication metadata and province association.

## Boundary

Publishing tourism content does not change operator regulatory status. Public channels must consume published records through application services rather than direct access to regulatory tables.
