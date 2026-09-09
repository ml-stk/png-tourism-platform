# ADR 0010 — Governed AI Concierge Boundary

## Status

Accepted

## Decision

The AI Concierge is a platform service with an explicit allowlisted tool boundary. Models never receive direct database access and cannot query regulatory or private repositories.

Only published tourism data exposed by approved tools may be supplied to a model adapter. Every response carries model and prompt versions plus source provenance.

The foundation uses deterministic service logic when no model adapter is configured. This ensures that an unconfigured provider cannot cause fabricated tourism information to be returned.

## Rationale

This prevents prompt-driven access from bypassing RBAC, publication governance, or the regulatory/public separation. It also makes model providers replaceable without changing domain governance.

The AI layer is therefore downstream of the same governed services used by other visitor channels rather than becoming a privileged alternative data path.

## Consequences

The initial AI layer has intentionally limited answer capability because telemetry, richer content metadata, external integrations, and an approved model provider are not yet established. Missing data must not be fabricated.

The foundation also requires additional production controls before public exposure: rate limiting, abuse protection, persisted audit events, prompt/model policy, stronger provenance handling, adversarial evaluation, observability, and a provider adapter.

## Security and governance invariants

1. Unknown tools are rejected.
2. Tool results are restricted to published tourism data.
3. Inactive operators are excluded from the public operator tool.
4. Regulatory/private requests are refused.
5. Unsafe requests are refused.
6. Out-of-scope requests are refused.
7. Model adapters receive governed tool results rather than repository or database access.
8. Responses identify the model/prompt versions and carry source provenance.
9. AI requests must not become an alternate path around server-side authorization or publication governance.
