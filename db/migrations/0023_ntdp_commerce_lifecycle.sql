create table if not exists commerce.transaction_events (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references commerce.transactions(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by uuid references users(id),
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  changed_at timestamptz not null default now()
);
create index if not exists idx_commerce_transaction_events on commerce.transaction_events(transaction_id, changed_at desc);
create index if not exists idx_commerce_transactions_provider on commerce.transactions(provider_id, created_at desc);
create index if not exists idx_commerce_transactions_external_ref on commerce.transactions(external_reference) where external_reference is not null;
