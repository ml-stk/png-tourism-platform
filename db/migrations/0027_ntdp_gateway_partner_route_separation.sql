-- Separate approved-partner gateway paths from public routes.
-- The previous control-plane seed used the public path patterns for both
-- public and approved-partner routes, making partner routes unreachable
-- because public visibility is intentionally preferred by authorization.
update gateway.routes
set path_pattern='/api/v1/partner/destinations', updated_at=now()
where route_key='partner-destinations';

update gateway.routes
set path_pattern='/api/v1/partner/content', updated_at=now()
where route_key='partner-content';
