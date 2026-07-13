-- Per-recipient audit trail for creator trade-alert delivery.
-- This table is server-managed only; followers never receive another user's email data.

create table if not exists alert_delivery_attempts (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  follower_user_id uuid not null references public.users(id) on delete cascade,
  recipient_email text not null,
  status text not null default 'queued'
    check (status in ('queued', 'sent', 'failed', 'skipped')),
  provider_message_id text,
  error_message text,
  attempts integer not null default 0 check (attempts >= 0),
  last_attempt_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (transaction_id, follower_user_id)
);

create index if not exists alert_delivery_attempts_retry_idx
  on public.alert_delivery_attempts (status, last_attempt_at asc)
  where status in ('queued', 'failed');

alter table public.alert_delivery_attempts enable row level security;

-- No browser policy: delivery records are accessed exclusively by server-side
-- service-role code, which keeps email addresses and provider identifiers private.
