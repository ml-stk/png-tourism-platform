alter table industry_profiles add column if not exists review_status text not null default 'draft' check (review_status in ('draft','submitted','published','suspended'));
update industry_profiles set review_status = case when published then 'published' else 'draft' end;
create index if not exists idx_industry_profiles_review on industry_profiles(province_code, review_status, updated_at desc);
