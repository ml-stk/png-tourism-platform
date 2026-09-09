# ADR 0010 — Governed AI Concierge Boundary

## Status
Accepted

## Decision
The AI Concierge is a platform service with an explicit allowlisted tool boundary. Models never receive direct database access and cannot query regulatory/private repositories.

Only published tourism data exposed by approved tools may be supplied to a model adapter. Every response carries model/prompt versions and source provenance.

## Rationale
This prevents prompt-driven access from bypassing RBAC, publication governance, or the regulatory/public separation. It also makes model providers replaceable without changing domain governance.

## Consequences
The AI layer may initially have limited answers because telemetry, richer content metadata, and external integrations are not yet approved. That limitation is intentional: missing data must not be fabricated.
