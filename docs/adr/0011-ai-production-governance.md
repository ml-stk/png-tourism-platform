# ADR 0011: AI production governance

## Decision
The AI Concierge uses an explicit provider/model/prompt allowlist and persists lifecycle audit events. Provider adapters receive only governed published-source tool results plus a registered system prompt.

## Rationale
This prevents an AI integration from becoming an alternate path into regulatory or private data and makes model/prompt provenance auditable.

## Consequences
Production configuration must explicitly allow the selected model and prompt. AI audit persistence requires migration `0005_ai_audit.sql`. Deployment infrastructure should add WAF/provider quotas in addition to the application rate limiter.
