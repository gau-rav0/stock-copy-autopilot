-- Read-only broker connection metadata and follower delivery preferences.
-- This schema deliberately stores no broker credentials, access tokens, or order permissions.

-- Alert delivery is handled by authenticated Next.js route handlers. Remove the
-- older database-trigger path so one trade cannot send two emails and no secret
-- has to be stored in Postgres runtime settings.
drop trigger if exists conviction_alert_trigger on public.transactions;
drop function if exists public.handle_conviction_alert();

create table if not exists broker_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  broker text not null check (broker in ('zerodha', 'upstox', 'angelone', 'groww', 'other')),
  purpose text not null check (purpose in ('creator', 'follower')),
  account_label text,
  status text not null default 'awaiting_authorization'
    check (status in ('awaiting_authorization', 'active', 'revoked', 'error')),
  read_permissions jsonb not null default '["holdings", "trades"]'::jsonb,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, broker, purpose)
);

create table if not exists notification_preferences (
  user_id uuid primary key references public.users(id) on delete cascade,
  trade_alerts_email boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists broker_trade_events (
  id uuid primary key default gen_random_uuid(),
  creator_user_id uuid not null references public.users(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  broker text not null,
  external_trade_id text not null,
  ticker text not null,
  action tx_action not null,
  price numeric,
  allocation_before numeric not null default 0,
  allocation_after numeric not null default 0,
  occurred_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (broker, external_trade_id)
);

create index if not exists broker_connections_user_id_idx on broker_connections(user_id);
create index if not exists broker_trade_events_profile_id_occurred_at_idx on broker_trade_events(profile_id, occurred_at desc);

alter table broker_connections enable row level security;
alter table notification_preferences enable row level security;
alter table broker_trade_events enable row level security;

create policy "Users manage their own broker connection metadata"
  on broker_connections for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage their own notification preferences"
  on notification_preferences for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Creators can view their own broker events"
  on broker_trade_events for select to authenticated
  using ((select auth.uid()) = creator_user_id);

-- Keep webhook event ingestion atomic: a provider fill either creates both the
-- audit event and the follower-facing transaction, or creates neither.
create or replace function public.ingest_broker_trade_event(
  p_creator_user_id uuid,
  p_broker text,
  p_external_trade_id text,
  p_ticker text,
  p_action tx_action,
  p_price numeric,
  p_allocation_before numeric,
  p_allocation_after numeric,
  p_occurred_at timestamptz
)
returns table(event_id uuid, transaction_id uuid, duplicate boolean)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_profile_id uuid;
  v_portfolio_id uuid;
  v_event_id uuid;
  v_transaction_id uuid;
begin
  select id into v_profile_id
  from profiles
  where user_id = p_creator_user_id and verified = true;

  if v_profile_id is null then
    raise exception 'verified creator not found';
  end if;

  if not exists (
    select 1 from broker_connections
    where user_id = p_creator_user_id
      and broker = p_broker
      and purpose = 'creator'
      and status = 'active'
  ) then
    raise exception 'active read-only broker connection not found';
  end if;

  select id into v_portfolio_id
  from portfolios
  where profile_id = v_profile_id
  order by created_at asc
  limit 1;

  if v_portfolio_id is null then
    raise exception 'creator portfolio not found';
  end if;

  begin
    insert into broker_trade_events (
      creator_user_id, profile_id, broker, external_trade_id, ticker, action, price,
      allocation_before, allocation_after, occurred_at
    ) values (
      p_creator_user_id, v_profile_id, p_broker, p_external_trade_id, p_ticker, p_action, p_price,
      p_allocation_before, p_allocation_after, p_occurred_at
    ) returning id into v_event_id;
  exception when unique_violation then
    select id into v_event_id
    from broker_trade_events
    where broker = p_broker and external_trade_id = p_external_trade_id;
    return query select v_event_id, null::uuid, true;
    return;
  end;

  insert into transactions (
    portfolio_id, ticker, action, allocation_before, allocation_after, price,
    transaction_date, is_conviction_alert, alert_text
  ) values (
    v_portfolio_id, p_ticker, p_action, p_allocation_before, p_allocation_after, coalesce(p_price, 0),
    p_occurred_at::date, true, format('Read-only %s trade feed update.', p_broker)
  ) returning id into v_transaction_id;

  update broker_connections
  set last_synced_at = now(), updated_at = now()
  where user_id = p_creator_user_id and broker = p_broker and purpose = 'creator';

  return query select v_event_id, v_transaction_id, false;
end;
$$;

revoke all on function public.ingest_broker_trade_event(uuid, text, text, text, tx_action, numeric, numeric, numeric, timestamptz) from public, anon, authenticated;
grant execute on function public.ingest_broker_trade_event(uuid, text, text, text, tx_action, numeric, numeric, numeric, timestamptz) to service_role;
