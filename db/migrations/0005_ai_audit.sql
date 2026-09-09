create table if not exists ai_audit_events (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  action text not null check (action in ('request','tool_call','response','refusal')),
  tool_name text,
  model_version text,
  prompt_version text not null,
  governed boolean not null default true,
  request_id text,
  metadata jsonb,
  occurred_at timestamptz not null default now()
);
create index if not exists idx_ai_audit_session on ai_audit_events(session_id, occurred_at desc);
create index if not exists idx_ai_audit_action on ai_audit_events(action, occurred_at desc);
