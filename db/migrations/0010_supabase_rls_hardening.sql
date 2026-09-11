-- Supabase hardening: public-schema tables must have RLS enabled.
-- The application uses its server-side PostgreSQL connection, so no anonymous
-- or authenticated Data API policies are granted by this migration.

alter table public.provinces enable row level security;
alter table public.operators enable row level security;
alter table public.roles enable row level security;
alter table public.role_permissions enable row level security;
alter table public.permissions enable row level security;
alter table public.users enable row level security;
alter table public.user_roles enable row level security;
alter table public.content_items enable row level security;
alter table public.destinations enable row level security;
alter table public.audit_events enable row level security;
alter table public.ai_audit_events enable row level security;
alter table public.industry_profiles enable row level security;
alter table public.industry_experiences enable row level security;
alter table public.visitor_leads enable row level security;
alter table public.visitor_engagement_events enable row level security;
alter table public.content_versions enable row level security;
alter table public.media_assets enable row level security;
alter table public.destination_media enable row level security;
alter table public.destination_content_links enable row level security;

create index if not exists idx_content_items_published_by on public.content_items(published_by);
create index if not exists idx_destination_content_links_content on public.destination_content_links(content_id);
create index if not exists idx_destination_media_asset on public.destination_media(media_asset_id);
create index if not exists idx_industry_experiences_destination on public.industry_experiences(destination_id);
create index if not exists idx_industry_experiences_operator on public.industry_experiences(operator_id);
create index if not exists idx_media_assets_province on public.media_assets(province_code);
create index if not exists idx_role_permissions_permission on public.role_permissions(permission_id);
create index if not exists idx_user_roles_operator on public.user_roles(operator_id);
create index if not exists idx_user_roles_province on public.user_roles(province_code);
create index if not exists idx_user_roles_role on public.user_roles(role_id);
create index if not exists idx_visitor_leads_experience on public.visitor_leads(experience_id);
