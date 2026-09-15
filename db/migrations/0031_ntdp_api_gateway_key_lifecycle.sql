alter table gateway.api_keys
  drop constraint if exists api_keys_revocation_consistency;

alter table gateway.api_keys
  add constraint api_keys_revocation_consistency
  check ((status = 'active' and revoked_at is null) or (status = 'revoked' and revoked_at is not null));

create or replace function gateway.revoke_keys_for_revoked_client()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'revoked' and old.status <> 'revoked' then
    update gateway.api_keys
    set status = 'revoked', revoked_at = coalesce(revoked_at, now())
    where client_id = new.id and status = 'active';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_gateway_revoke_keys_for_revoked_client on gateway.api_clients;
create trigger trg_gateway_revoke_keys_for_revoked_client
after update of status on gateway.api_clients
for each row execute function gateway.revoke_keys_for_revoked_client();

create or replace function gateway.prevent_api_key_reactivation()
returns trigger
language plpgsql
as $$
begin
  if old.status = 'revoked' and new.status <> 'revoked' then
    raise exception 'Gateway API keys are terminal after revocation';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_gateway_api_key_terminal on gateway.api_keys;
create trigger trg_gateway_api_key_terminal
before update of status on gateway.api_keys
for each row execute function gateway.prevent_api_key_reactivation();
