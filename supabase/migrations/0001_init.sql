-- Follow Verified Investors — initial schema
-- Run via: supabase db push  (or paste into the Supabase SQL editor)

create extension if not exists "pgcrypto";

create type user_role as enum ('follower', 'creator', 'admin');
create type investing_style as enum ('value', 'growth', 'dividend', 'momentum', 'smallcap', 'longterm');
create type verification_tier as enum ('demo', 'cas', 'broker', 'auto');
create type tx_action as enum ('buy', 'add', 'reduce', 'exit');
create type notification_type as enum ('conviction_alert', 'monthly_summary', 'new_stock', 'full_exit');
create type subscription_status as enum ('active', 'cancelled', 'past_due');

create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  phone text,
  role user_role not null default 'follower',
  created_at timestamptz not null default now()
);

create table profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  display_name text not null,
  bio text,
  photo_url text,
  investing_style investing_style not null,
  verified boolean not null default false,
  verification_tier verification_tier not null default 'demo',
  created_at timestamptz not null default now()
);

create table portfolios (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  name text not null default 'Primary',
  is_demo boolean not null default true,
  created_at timestamptz not null default now()
);

create table holdings (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references portfolios(id) on delete cascade,
  ticker text not null,
  allocation_pct numeric not null,
  avg_buy_price numeric,
  current_price numeric,
  holding_since date,
  unrealized_return_pct numeric
);

create table transactions (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references portfolios(id) on delete cascade,
  ticker text not null,
  action tx_action not null,
  allocation_before numeric not null default 0,
  allocation_after numeric not null default 0,
  price numeric,
  transaction_date date not null,
  created_at timestamptz not null default now()
);

create table followers (
  id uuid primary key default gen_random_uuid(),
  follower_user_id uuid not null references users(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  subscribed boolean not null default false,
  subscription_id text,
  followed_at timestamptz not null default now(),
  unique (follower_user_id, profile_id)
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  follower_user_id uuid not null references users(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  type notification_type not null,
  payload jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  follower_user_id uuid not null references users(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  amount_inr numeric not null,
  platform_cut_pct numeric not null default 30,
  status subscription_status not null default 'active',
  razorpay_subscription_id text,
  created_at timestamptz not null default now()
);

-- Conviction alert trigger logic lives in application code (see lib/ai.ts and
-- /api/internal/conviction-check in the PRD), not in a DB trigger — it needs
-- to call an external AI API to generate the summary text.

-- Row Level Security: enable and add policies before going to production.
-- Not included here since policies depend on your auth setup (Supabase Auth
-- vs custom). Do not ship this schema to production with RLS off.
alter table profiles enable row level security;
alter table followers enable row level security;
alter table notifications enable row level security;
alter table subscriptions enable row level security;
