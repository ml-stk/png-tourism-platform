# Operator API

The operator API is a regulatory boundary. All routes require authentication and server-side authorization.

## Lifecycle

`pending_review -> active -> suspended -> closed`

A pending registration may be rejected, which records the regulatory outcome as `closed`. Invalid transitions return `409 CONFLICT`.

Compliance is independent of publication and operator status. Allowed values are `unknown`, `compliant`, `conditional`, and `non_compliant`. Closed operators cannot have compliance updated.

## Endpoints

- `GET /api/v1/operators` — list operators; optional `province`, `status`, and `cursor` filters.
- `GET /api/v1/operators/:id` — read one operator.
- `POST /api/v1/operators` — register an operator.
- `POST /api/v1/operators/:id/approve` — approve a pending registration.
- `POST /api/v1/operators/:id/reject` — reject a pending registration; body requires `{ "reason": "..." }`.
- `POST /api/v1/operators/:id/compliance` — update compliance; body requires `{ "status": "compliant|conditional|non_compliant|unknown", "note": "..." }`.
- `POST /api/v1/operators/:id/suspend` — suspend an active operator; body requires `{ "reason": "..." }`.
- `POST /api/v1/operators/:id/close` — close a suspended operator; body requires `{ "reason": "..." }`.

## Authorization

- `operator:approve` controls approval/rejection.
- `operator:manage_compliance` controls compliance changes.
- `operator:manage_status` controls suspension/closure.
- Regulatory mutations are restricted to platform administrators and TPA regulatory officers by default.
- Province scoping is enforced server-side before regulatory mutation.
- Operator self-service remains read-only until additional permissions are explicitly designed.

## Audit

Lifecycle mutations emit immutable audit events with the actor, request ID, target, action, outcome, and—where applicable—a normalized reason or compliance note. Regulatory state is not implicitly published to visitor channels.
