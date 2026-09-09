# Public Visitor Boundary

Anonymous visitor traffic uses `/api/v1/public/*` and is handled by `PublicVisitorService` through repository contracts.

Only explicitly published destinations and content are returned. Public operator profiles are limited to active, compliant operators with an explicit trading name and expose only the trading name and province. Regulatory legal names, compliance details, audit data, and internal authorization data remain private.

Administrative `/api/v1/*` routes remain authenticated and permission-protected.
