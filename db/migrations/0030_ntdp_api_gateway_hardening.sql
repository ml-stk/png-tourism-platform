create index if not exists idx_gateway_api_keys_hash_status on gateway.api_keys(key_hash,status);
create index if not exists idx_gateway_request_log_client_requested on gateway.request_log(client_id,requested_at desc);
create index if not exists idx_gateway_request_log_route_requested on gateway.request_log(route_key,requested_at desc);

create or replace function gateway.validate_client_scope_grant(granted jsonb)
returns boolean language sql immutable as $$
  select jsonb_typeof(granted) = 'array'
    and not exists (
      select 1 from jsonb_array_elements(granted) item
      where jsonb_typeof(item) <> 'string' or length(trim(item #>> '{}')) = 0
    );
$$;

alter table gateway.api_clients
  drop constraint if exists api_clients_allowed_scopes_array;
alter table gateway.api_clients
  add constraint api_clients_allowed_scopes_array
  check (gateway.validate_client_scope_grant(allowed_scopes));

alter table gateway.api_clients
  drop constraint if exists api_clients_rate_limit_positive;
alter table gateway.api_clients
  add constraint api_clients_rate_limit_positive
  check (rate_limit_per_minute between 1 and 100000);

create or replace function gateway.reject_disabled_key_use() returns trigger
language plpgsql as $$
begin
  if exists (
    select 1 from gateway.api_clients c
    where c.id = new.client_id and c.status <> 'approved'
  ) then
    raise exception 'API key client must be approved' using errcode='23514';
  end if;
  return new;
end;
$$;

-- Request logging is append-only: application code may record outcomes but must not rewrite history.
create or replace function gateway.prevent_request_log_mutation() returns trigger
language plpgsql as $$
begin
  raise exception 'Gateway request log is append-only';
end;
$$;
drop trigger if exists trg_gateway_request_log_immutable on gateway.request_log;
create trigger trg_gateway_request_log_immutable
before update or delete on gateway.request_log
for each row execute function gateway.prevent_request_log_mutation();
