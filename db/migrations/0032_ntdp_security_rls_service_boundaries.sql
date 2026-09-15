-- Lock down legacy public-schema tables that are accessed through the NTDP server/API layer.
-- Keep service_role access explicit while removing direct anon/authenticated table access.

do $$
declare
  t text;
begin
  foreach t in array array[
    'ai_audit_events','audit_events','content_items','content_versions',
    'destination_content_links','destination_media','destinations',
    'industry_experiences','industry_profiles','media_assets','operators',
    'permissions','provinces','role_permissions','roles','user_roles','users',
    'visitor_engagement_events','visitor_leads'
  ] loop
    execute format('revoke all on table public.%I from anon, authenticated', t);
    execute format('drop policy if exists %I on public.%I', t || '_service_role', t);
    execute format('create policy %I on public.%I for all to service_role using (true) with check (true)', t || '_service_role', t);
  end loop;
end $$;
