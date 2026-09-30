-- This trigger function was never attached to a trigger. The later client and key
-- lifecycle migrations enforce the intended controls with dedicated functions.
drop function if exists gateway.reject_disabled_key_use();
