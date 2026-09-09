# ADR 0009: Governed tourism intelligence boundary

## Decision
Tourism intelligence is implemented behind an application service that consumes domain repositories and emits typed KPI/report contracts with provenance.

## Rules
1. UI consumers do not query persistence directly.
2. Public visitor APIs never expose regulatory operator attributes.
3. Unknown visitor volumes are represented as zero until an approved telemetry source exists; estimates must be explicitly labelled when introduced.
4. External statistics enter through adapters with source, freshness and provenance metadata.
5. AI consumers will use the same governed intelligence service rather than direct database access.
