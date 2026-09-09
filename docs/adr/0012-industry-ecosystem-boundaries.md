# ADR 0012: Industry ecosystem boundaries

## Decision

Introduce an industry ecosystem service as a modular boundary between active tourism operators and visitor-facing industry information.

## Rules

1. Public profiles and experiences are published views, not regulatory records.
2. Experience publication remains under the existing governed content workflow.
3. Operator mutations require active operator state and optimistic version checks.
4. Visitor leads target active operators and are operator-scoped.
5. Province filters are enforced at service/API boundaries.
6. AI may consume only governed public sources through approved tools.

This keeps industry participation extensible while preserving the regulatory/public separation established by the platform architecture.
