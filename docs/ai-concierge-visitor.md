# Governed AI Concierge — Visitor Experience v1

The visitor Concierge is a responsive web/PWA experience over the existing governed AI service.

## Experience
- Conversational destination, experience and operator assistance.
- Quick prompts for common visitor intents.
- Published source references are shown with responses.
- Refusal states are explicit when a request is unsafe, private, regulatory, internal, unpublished, or outside tourism scope.
- Live answers require connectivity; cached trip and public tourism content remain available offline.
- Session identifiers are stored locally for continuity and are sent only to the governed Concierge API.

## Architecture boundary
The UI calls `POST /api/v1/ai/concierge`. It does not access PostgreSQL, AI providers, audit storage, or private operator records directly.

The server remains authoritative for:
- model/provider/prompt allowlisting;
- published-content retrieval and province scoping;
- refusal policy;
- request correlation and rate limiting;
- persisted AI request/tool-call/response/refusal audit;
- provenance returned to the visitor.

## Visitor trust model
The interface deliberately communicates that the Concierge is grounded in published tourism sources. It does not present stale or offline data as a live AI answer and does not expose internal governance metadata.

## Future integration
The next iteration can add itinerary-aware prompts, direct handoffs into destination/experience/operator/event/campaign routes, and approved non-PII engagement telemetry. These must continue through existing visitor journey, QR, campaign/event, and engagement service boundaries.
