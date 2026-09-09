# Industry Ecosystem v1 status

The initial service boundary is implemented on `feature/industry-ecosystem-v1`.

Implemented: public published profile/experience discovery, active-operator mutation guard, optimistic version boundary, governed experience publication restriction, and operator-scoped visitor lead contracts.

Remaining integration work belongs in the HTTP/API and persistence adapters: wire the repository to PostgreSQL, add authenticated operator endpoints, add visitor lead endpoint validation/rate controls, and connect public discovery to the visitor experience without exposing regulatory fields.
