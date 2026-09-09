# ADR 0006: Governed Destination and Content Publication

## Decision

Destination and tourism content are managed as separate publication-controlled records. Regulatory operator status is never inferred from public publication state.

Content moves through explicit draft/review/published/archived states. Publication requires the dedicated publish permission and a reviewed state. Province-scoped users are checked against the destination province at the API boundary.

## Rationale

This preserves the regulatory/public data boundary established by ADR 0002 while allowing TPA content teams to curate visitor-facing information without mutating regulatory records. Version checks and audit events provide traceability and concurrency protection.
