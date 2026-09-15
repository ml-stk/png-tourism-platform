create or replace function gateway.validate_client_status_transition()
returns trigger
language plpgsql
as $$
begin
  if new.status = old.status then
    return new;
  end if;

  if old.status = 'pending' and new.status in ('approved', 'revoked') then
    return new;
  end if;
  if old.status = 'approved' and new.status in ('suspended', 'revoked') then
    return new;
  end if;
  if old.status = 'suspended' and new.status in ('approved', 'revoked') then
    return new;
  end if;

  raise exception 'Invalid API client status transition: % -> %', old.status, new.status
    using errcode = '22023';
end;
$$;

drop trigger if exists trg_gateway_api_client_status_transition on gateway.api_clients;
create trigger trg_gateway_api_client_status_transition
before update of status on gateway.api_clients
for each row execute function gateway.validate_client_status_transition();

create index if not exists idx_gateway_api_clients_status_updated
  on gateway.api_clients(status, updated_at desc);
