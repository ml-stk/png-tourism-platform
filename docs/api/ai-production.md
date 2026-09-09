# AI production governance

The concierge is a governed application boundary. It may use only allowlisted tools and published tourism sources.

## Policy

- `AI_PROVIDER` selects the configured provider adapter.
- `AI_MODEL` must be present in `AI_ALLOWED_MODELS`.
- `AI_PROMPT_VERSION` must be a registered prompt version.
- The production adapter receives the governed system prompt and only tool results from published sources.
- Requests, tool calls, responses, and refusals are persisted as AI audit events when the audit repository is configured.
- The API's general rate limiter remains active; AI requests should additionally be protected by deployment-level quotas/WAF controls.

## Provenance

Every returned source is marked `published` and contains an entity/version provenance identifier. Providers must not replace or invent source references. A response without supporting sources must state that the available governed data does not support the answer.

## Data boundary

The concierge cannot access regulatory, private, unpublished, credentials, or internal records. Province scoping is applied before tool results are returned.
