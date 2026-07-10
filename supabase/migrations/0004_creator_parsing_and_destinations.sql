-- Store parsed creator application evidence and make outbound delivery state auditable.

alter table creator_applications
  add column if not exists parse_status text not null default 'not_parsed',
  add column if not exists parse_error text,
  add column if not exists parsed_holdings jsonb not null default '[]'::jsonb,
  add column if not exists parsed_warnings jsonb not null default '[]'::jsonb,
  add column if not exists parsed_at timestamptz;

create table if not exists creator_application_holdings (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references creator_applications(id) on delete cascade,
  symbol text,
  name text not null,
  quantity numeric,
  market_value numeric,
  weight_pct numeric,
  confidence text not null default 'low' check (confidence in ('high', 'medium', 'low')),
  source_line text,
  created_at timestamptz not null default now()
);

create table if not exists outbound_deliveries (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  destination text not null,
  status text not null check (status in ('sent', 'skipped', 'failed')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table creator_application_holdings enable row level security;
alter table outbound_deliveries enable row level security;

drop policy if exists "Anyone can submit parsed creator holdings" on creator_application_holdings;
drop policy if exists "Service role can manage outbound deliveries" on outbound_deliveries;

create policy "Anyone can submit parsed creator holdings" on creator_application_holdings for insert with check (true);
create policy "Service role can manage outbound deliveries" on outbound_deliveries for all using (auth.role() = 'service_role');
