-- Only for an empty disposable PostgreSQL/PostGIS CI database, never production.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;

-- Match Supabase's public-schema privilege model so tests exercise RLS rather than
-- succeeding merely because client roles lack table privileges.
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all privileges on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all privileges on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to service_role;
