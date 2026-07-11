-- Harden RLS policies and add waitlist capture table.

-- ===== users table: enable RLS + service-role-only writes =====
alter table users enable row level security;

drop policy if exists "Service role manages users" on users;
create policy "Service role manages users" on users for all
  using (auth.role() = 'service_role');

-- ===== Core data tables: restrict writes to service role =====
-- (SELECT policies already exist from 0002; this adds INSERT/UPDATE/DELETE guards)

drop policy if exists "Service role manages portfolios" on portfolios;
create policy "Service role manages portfolios" on portfolios for insert
  with check (auth.role() = 'service_role');

drop policy if exists "Service role updates portfolios" on portfolios;
create policy "Service role updates portfolios" on portfolios for update
  using (auth.role() = 'service_role');

drop policy if exists "Service role manages holdings" on holdings;
create policy "Service role manages holdings" on holdings for insert
  with check (auth.role() = 'service_role');

drop policy if exists "Service role updates holdings" on holdings;
create policy "Service role updates holdings" on holdings for update
  using (auth.role() = 'service_role');

drop policy if exists "Service role manages transactions" on transactions;
create policy "Service role manages transactions" on transactions for insert
  with check (auth.role() = 'service_role');

drop policy if exists "Service role manages growth" on portfolio_growth;
create policy "Service role manages growth" on portfolio_growth for insert
  with check (auth.role() = 'service_role');

-- ===== Waitlist signups =====
create table if not exists waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text not null default 'roast_page',
  created_at timestamptz not null default now()
);

alter table waitlist_signups enable row level security;

drop policy if exists "Anyone can join waitlist" on waitlist_signups;
create policy "Anyone can join waitlist" on waitlist_signups for insert
  with check (true);

drop policy if exists "Service role reads waitlist" on waitlist_signups;
create policy "Service role reads waitlist" on waitlist_signups for select
  using (auth.role() = 'service_role');
