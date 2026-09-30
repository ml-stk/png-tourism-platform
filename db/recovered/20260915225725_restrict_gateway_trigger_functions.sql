REVOKE EXECUTE ON FUNCTION gateway.prevent_api_key_reactivation() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION gateway.prevent_request_log_mutation() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION gateway.revoke_keys_for_revoked_client() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION gateway.validate_client_scope_grant(jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION gateway.validate_client_status_transition() FROM PUBLIC, anon, authenticated;
