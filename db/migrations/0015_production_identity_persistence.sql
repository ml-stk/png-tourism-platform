-- Persist externally authenticated identities so regulated actions have
-- stable internal actors for audit trails and account deactivation.

alter table users
  add column if not exists last_login_at timestamptz;

create index if not exists idx_users_active_external_subject
  on users(external_subject, is_active);

-- user_roles is already the governed assignment table. Production login
-- hydration may create role bindings from trusted IdP claims; later TPA
-- administration can refine those assignments without changing the external
-- identity subject.
