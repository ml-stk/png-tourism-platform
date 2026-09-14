revoke execute on function public.st_estimatedextent(text, text) from public;
revoke execute on function public.st_estimatedextent(text, text, text) from public;
revoke execute on function public.st_estimatedextent(text, text, text, boolean) from public;

-- PostGIS remains in the managed public extension schema; privilege hardening is best-effort
-- because Supabase-managed extension ownership may reassert extension grants.