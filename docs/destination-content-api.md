# Destination and Content Management API

All routes use `/api/v1`, require authenticated users, and return the standard `{ data, requestId }` envelope.

## Destinations

- `GET /destinations` — read destinations; province filtering is scope-checked.
- `GET /destinations/:id` — read one destination; province access is enforced.
- `POST /destinations` — create a draft destination; requires `content:write`.

Destination publication states are `draft -> review -> published -> archived`. Publication is separate from regulatory operator status.

## Content

- `GET /content` — list content, optionally by type/status.
- `GET /content/:id` — retrieve content.
- `POST /content` — create draft content; requires `content:write`.
- `POST /content/:id/publish` — publish reviewed content; requires `content:publish`.

Content publication is governed by an explicit review gate. Writes and publication mutations create audit events. Optimistic version checks prevent overwriting concurrent edits.
