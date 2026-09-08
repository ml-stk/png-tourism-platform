-- Preserve regulatory reasons and notes with auditable operator lifecycle events.
alter table audit_events add column if not exists metadata jsonb;

insert into permissions (code, description) values
  ('operator:manage_status','Suspend or close tourism operators')
on conflict (code) do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p on p.code = 'operator:manage_status'
where r.code in ('platform_admin','tpa_regulator')
on conflict do nothing;
