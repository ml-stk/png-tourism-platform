update gateway.routes
set path_pattern='/api/v1/partner/destinations', updated_at=now()
where route_key='partner-destinations';

update gateway.routes
set path_pattern='/api/v1/partner/content', updated_at=now()
where route_key='partner-content';
