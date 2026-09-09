# Phase 8 — Governed AI Concierge Foundation

## Purpose
Establish the AI Concierge as a governed platform service. The AI layer may use approved tourism tools, but it does not receive direct database access and it cannot access regulatory or private records.

## Boundary

`visitor channel -> AI concierge service -> allowlisted tool -> platform repository/service -> published tourism data`

The model adapter receives the visitor request plus tool results. It does not receive database credentials or unrestricted repository handles.

## Allowed sources
- Published destinations
- Published tourism experiences/content
- Active operator profiles represented through the public boundary

Regulatory compliance, licensing, suspension, internal audit, user administration, and other private records are outside the AI source boundary.

## Governance controls
- Explicit tool allowlist
- Tool risk classification
- Published-data filtering in every tool
- Refusal categories for private/regulatory, unsafe, and out-of-scope requests
- Prompt version attached to every response
- Model adapter version attached to every response
- Source/provenance references attached to generated answers
- Governed audit event contract
- Deterministic tests around the service boundary

## Model integration
The initial implementation uses an optional model adapter. If no adapter is configured, the service returns a deterministic governed response rather than silently inventing tourism facts. A production model adapter must be implemented behind the same interface and must consume only the tool results supplied by the service.

## Next hardening
- Add authenticated `/api/v1/ai/concierge` route with visitor rate limits
- Add conversation/session persistence with retention controls
- Add structured AI audit persistence
- Add signed/public provenance resolution
- Add prompt registry and model policy configuration
- Add safety evaluation fixtures and adversarial tests
- Add observability metrics for refusals, tool calls, latency, and model errors
- Add an approved OpenAI/provider adapter without changing the governance boundary
