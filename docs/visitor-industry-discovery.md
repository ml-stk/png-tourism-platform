# Visitor industry discovery

The visitor industry surface consumes only the public Industry Ecosystem API:

- `GET /api/v1/industry/profiles`
- `GET /api/v1/industry/experiences`
- `POST /api/v1/industry/leads`

The UI filters published experiences by province, attributes each experience to its published operator profile, supports QR/deep-link handoff references, and captures visitor enquiries through the governed lead endpoint.

## Offline behaviour

Discovery responses are cached in session storage for the current visitor session. When connectivity is lost, the UI clearly identifies cached discovery and disables lead submission until connected. No regulatory or private operator data is cached or exposed.

## Security boundary

The frontend never accesses PostgreSQL directly. Public discovery is published-only; lead creation validates the selected published experience and operator server-side. Operator administration remains behind authenticated server-side authorization.
