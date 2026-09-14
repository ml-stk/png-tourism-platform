-- Register public detail resources with the NTDP API gateway so they
-- receive the same route discovery, observability and partner-channel
-- governance as the collection endpoints.

insert into gateway.routes(
  route_key,
  method,
  path_pattern,
  description,
  visibility,
  required_scope,
  upstream_service,
  status
)
values
  ('public-destination-detail','GET','/api/v1/public/destinations/{id}','Public destination detail','public',null,'visitor','active'),
  ('public-content-detail','GET','/api/v1/public/content/{id}','Public content detail','public',null,'visitor','active'),
  ('public-operator-detail','GET','/api/v1/public/operators/{id}','Public operator detail','public',null,'visitor','active')
on conflict (route_key) do update set
  method=excluded.method,
  path_pattern=excluded.path_pattern,
  description=excluded.description,
  visibility=excluded.visibility,
  required_scope=excluded.required_scope,
  upstream_service=excluded.upstream_service,
  status=excluded.status,
  updated_at=now();
