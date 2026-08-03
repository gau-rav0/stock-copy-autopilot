-- Auditable, user-owned import snapshots. Credentials and source files are never retained.
create table if not exists public.portfolio_imports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  source text not null check (source in ('csv', 'contract_note', 'statement', 'email')),
  broker text check (broker in ('zerodha', 'upstox', 'angelone', 'groww', 'other')),
  status text not null check (status in ('completed', 'completed_with_errors', 'failed')),
  holdings jsonb not null default '[]'::jsonb,
  errors jsonb not null default '[]'::jsonb,
  duplicates jsonb not null default '[]'::jsonb,
  missing_symbols jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists portfolio_imports_user_created_idx on public.portfolio_imports (user_id, created_at desc);
alter table public.portfolio_imports enable row level security;
create policy "Users manage their own portfolio imports" on public.portfolio_imports for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
