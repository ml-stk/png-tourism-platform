# ADR 0005: Operator lifecycle boundary

Operator registration is a regulatory mutation and therefore runs through `OperatorService`. The HTTP layer is responsible only for authentication, authorization, request parsing, and response mapping.

New registrations enter `pending_review` with `unknown` compliance. Approval and compliance transitions remain separate capabilities so regulatory decisions cannot be conflated with self-service registration.
