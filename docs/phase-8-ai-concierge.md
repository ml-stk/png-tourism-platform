# Phase 8 — Governed AI Concierge Foundation

## Goal

Establish an AI Concierge service boundary that can support future visitor assistance and internal intelligence without allowing a model to bypass platform governance.

## Implemented

- Explicit AI domain contracts for tools, sources, responses and audit events.
- Allowlisted low-risk tools backed by published tourism data.
- Published destination retrieval.
- Published experience retrieval.
- Active, compliant operator retrieval with deliberately limited public fields.
- Refusal handling for private/regulatory, unsafe and out-of-scope requests.
- Model and prompt version metadata on responses.
- Source provenance on tool results and responses.
- Optional model adapter receiving governed tool results rather than repository handles.
- Authenticated API boundary at `/api/v1/ai/concierge`.

## Production hardening

Visitor-facing exposure requires rate limiting and abuse controls, persisted AI audit events, provider/model allowlisting, prompt registry, provenance integrity, adversarial safety testing and observability.
