# AI productionization status

Implemented on `feature/ai-productionization`:

- persisted AI audit-event schema and PostgreSQL adapter
- provider/model allowlist policy
- registered prompt-version policy
- governed system prompt passed to provider adapters
- request/tool/response/refusal audit lifecycle
- request ID correlation in AI audit records
- production configuration guidance
- regression tests for model and prompt allowlisting

The existing public-only tools, province scoping, and refusal rules remain in force.
