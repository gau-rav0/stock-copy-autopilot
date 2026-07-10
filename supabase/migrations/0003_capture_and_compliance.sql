-- Capture tables for conversion intent, creator review, and deletion requests.

create table if not exists roast_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  display_name text,
  score integer,
  risk_score integer,
  holdings_count integer,
  invested_value numeric,
  current_value numeric,
  generated_by text,
  source text not null default 'portfolio_roast',
  created_at timestamptz not null default now()
);

create table if not exists follow_intents (
  id uuid primary key default gen_random_uuid(),
  investor_slug text,
  investor_name text,
  email text,
  source text not null default 'follow_button',
  created_at timestamptz not null default now()
);

create table if not exists creator_applications (
  id uuid primary key default gen_random_uuid(),
  creator_name text,
  email text not null,
  method text not null check (method in ('cas', 'manual')),
  cas_file_name text,
  holdings_text text,
  status text not null default 'pending_review',
  created_at timestamptz not null default now()
);

create table if not exists data_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  request_type text not null default 'delete_all',
  details text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

alter table roast_leads enable row level security;
alter table follow_intents enable row level security;
alter table creator_applications enable row level security;
alter table data_deletion_requests enable row level security;

drop policy if exists "Anyone can submit roast leads" on roast_leads;
drop policy if exists "Anyone can submit follow intents" on follow_intents;
drop policy if exists "Anyone can submit creator applications" on creator_applications;
drop policy if exists "Anyone can submit deletion requests" on data_deletion_requests;

create policy "Anyone can submit roast leads" on roast_leads for insert with check (true);
create policy "Anyone can submit follow intents" on follow_intents for insert with check (true);
create policy "Anyone can submit creator applications" on creator_applications for insert with check (true);
create policy "Anyone can submit deletion requests" on data_deletion_requests for insert with check (true);
