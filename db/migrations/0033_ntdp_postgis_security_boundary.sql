-- NTDP uses PostGIS through the server/service layer; do not expose SECURITY DEFINER
-- extension helpers or the spatial reference catalog directly to API roles.
revoke all on table public.spatial_ref_sys from anon, authenticated;
revoke execute on function public.st_estimatedextent(text,text) from anon, authenticated;
revoke execute on function public.st_estimatedextent(text,text,text) from anon, authenticated;
revoke execute on function public.st_estimatedextent(text,text,text,boolean) from anon, authenticated;
