ALTER FUNCTION public.tia_record_membership_event() SET search_path = public, pg_catalog;
ALTER FUNCTION gateway.prevent_api_key_reactivation() SET search_path = gateway, pg_catalog;
ALTER FUNCTION gateway.prevent_request_log_mutation() SET search_path = gateway, pg_catalog;
ALTER FUNCTION gateway.revoke_keys_for_revoked_client() SET search_path = gateway, pg_catalog;
ALTER FUNCTION gateway.validate_client_scope_grant(jsonb) SET search_path = gateway, pg_catalog;
ALTER FUNCTION gateway.validate_client_status_transition() SET search_path = gateway, pg_catalog;
