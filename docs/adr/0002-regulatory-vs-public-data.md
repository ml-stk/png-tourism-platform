# ADR 0002: Regulatory Data vs Public Content

## Status
Accepted

## Decision

Regulatory records are authoritative internal records. Public-facing operator and destination information is separately publishable content derived from eligible source records.

## Rationale

A business being registered or licensed does not automatically mean every regulatory field is suitable for public publication. Editorial control, privacy, compliance and historical traceability require separate publication state.

## Consequences

- Public APIs expose only explicitly published fields/content.
- Regulatory changes do not automatically overwrite published content.
- Publication actions can be audited independently.
