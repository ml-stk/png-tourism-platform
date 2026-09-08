# ADR 0001: Platform Boundaries

## Status
Accepted

## Decision

The PNG Tourism Platform uses a modular service-oriented application boundary with shared domain contracts. It is not initially split into independently deployed microservices.

## Rationale

The platform needs strong separation of concerns without introducing unnecessary operational complexity at the start. Domain modules and adapters provide clear seams for later extraction if scale or organizational boundaries require it.

## Consequences

- One deployable application can initially deliver the platform.
- Domain services remain independently testable.
- Persistence and integration adapters can be replaced without rewriting channel UI.
- Future service extraction is possible at explicit boundaries.
