-- Public marketplace fields, policies, and demo seed data for the live app.

alter table profiles add column if not exists slug text;
alter table profiles add column if not exists follower_count integer not null default 0;
alter table profiles add column if not exists cagr numeric not null default 0;
alter table profiles add column if not exists xirr numeric not null default 0;
alter table profiles add column if not exists alpha numeric not null default 0;
alter table profiles add column if not exists max_drawdown numeric not null default 0;
alter table profiles add column if not exists volatility numeric not null default 0;
alter table profiles add column if not exists win_rate numeric not null default 0;
alter table profiles add column if not exists sort_order integer not null default 999;
alter table holdings add column if not exists company_name text;
alter table transactions add column if not exists is_conviction_alert boolean not null default false;
alter table transactions add column if not exists alert_text text;

create unique index if not exists profiles_slug_key on profiles(slug);
create unique index if not exists portfolios_profile_name_key on portfolios(profile_id, name);

create table if not exists portfolio_growth (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references portfolios(id) on delete cascade,
  month text not null,
  portfolio numeric not null,
  nifty50 numeric not null,
  sort_order integer not null default 0
);

alter table portfolios enable row level security;
alter table holdings enable row level security;
alter table transactions enable row level security;
alter table portfolio_growth enable row level security;

drop policy if exists "Profiles are viewable by everyone" on profiles;
drop policy if exists "Portfolios are viewable by everyone" on portfolios;
drop policy if exists "Holdings are viewable by everyone" on holdings;
drop policy if exists "Transactions are viewable by everyone" on transactions;
drop policy if exists "Growth is viewable by everyone" on portfolio_growth;
drop policy if exists "Users can manage own follows" on followers;
drop policy if exists "Users can view own notifications" on notifications;
drop policy if exists "System can insert notifications" on notifications;
drop policy if exists "Users can view own subscriptions" on subscriptions;

create policy "Profiles are viewable by everyone" on profiles for select using (true);
create policy "Portfolios are viewable by everyone" on portfolios for select using (true);
create policy "Holdings are viewable by everyone" on holdings for select using (true);
create policy "Transactions are viewable by everyone" on transactions for select using (true);
create policy "Growth is viewable by everyone" on portfolio_growth for select using (true);
create policy "Users can manage own follows" on followers for all using (auth.uid() = follower_user_id);
create policy "Users can view own notifications" on notifications for select using (auth.uid() = follower_user_id);
create policy "System can insert notifications" on notifications for insert with check (true);
create policy "Users can view own subscriptions" on subscriptions for select using (auth.uid() = follower_user_id);

insert into users (id, email, role) values
  ('00000000-0000-0000-0000-000000000001', 'arjun-mehta@ledger.demo', 'creator'),
  ('00000000-0000-0000-0000-000000000002', 'priya-shah@ledger.demo', 'creator'),
  ('00000000-0000-0000-0000-000000000003', 'rahul-kapoor@ledger.demo', 'creator'),
  ('00000000-0000-0000-0000-000000000004', 'neha-iyer@ledger.demo', 'creator'),
  ('00000000-0000-0000-0000-000000000005', 'vikram-rao@ledger.demo', 'creator'),
  ('00000000-0000-0000-0000-000000000006', 'ananya-sen@ledger.demo', 'creator'),
  ('00000000-0000-0000-0000-000000000007', 'kabir-malhotra@ledger.demo', 'creator'),
  ('00000000-0000-0000-0000-000000000008', 'mira-dsouza@ledger.demo', 'creator'),
  ('00000000-0000-0000-0000-000000000009', 'dev-narang@ledger.demo', 'creator'),
  ('00000000-0000-0000-0000-000000000010', 'tara-gupta@ledger.demo', 'creator')
on conflict (email) do update set role = excluded.role;

insert into profiles (id, user_id, slug, display_name, bio, photo_url, investing_style, verified, verification_tier, follower_count, cagr, xirr, alpha, max_drawdown, volatility, win_rate, sort_order) values
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', 'arjun-mehta', 'Arjun Mehta', 'Concentrated value investor. 12 years, 3 drawdowns, 0 diworsification.', '', 'value', true, 'cas', 4210, 21.4, 23.1, 6.8, -31.2, 18.9, 64, 1),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000002', 'priya-shah', 'Priya Shah', 'Small-cap hunter. If it is covered by 12 analysts, she probably sold it.', '', 'smallcap', true, 'broker', 2870, 28.9, 31.4, 11.2, -42.6, 27.3, 57, 2),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000003', 'rahul-kapoor', 'Rahul Kapoor', 'Growth at a reasonable price. Emphasis on reasonable.', '', 'growth', true, 'cas', 6120, 19.7, 20.8, 4.1, -26.8, 16.4, 61, 3),
  ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000004', 'neha-iyer', 'Neha Iyer', 'Dividend compounder. Boring is a feature, not a bug.', '', 'dividend', true, 'demo', 1540, 14.2, 14.9, 1.8, -14.3, 9.7, 70, 4),
  ('00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000005', 'vikram-rao', 'Vikram Rao', 'Momentum and trend-following. Cuts losers fast, lets winners get loud.', '', 'momentum', false, 'demo', 890, 24.6, 22, 7.9, -38.1, 33.5, 49, 5),
  ('00000000-0000-0000-0000-000000000106', '00000000-0000-0000-0000-000000000006', 'ananya-sen', 'Ananya Sen', 'Long-term quality investor. Prefers moats, cash flows, and sleep.', '', 'longterm', true, 'cas', 3380, 17.8, 18.6, 3.9, -19.4, 13.8, 66, 6),
  ('00000000-0000-0000-0000-000000000107', '00000000-0000-0000-0000-000000000007', 'kabir-malhotra', 'Kabir Malhotra', 'Contrarian value. Buys when everyone else is writing dramatic threads.', '', 'value', true, 'demo', 2060, 16.9, 17.2, 2.6, -24.1, 15.6, 59, 7),
  ('00000000-0000-0000-0000-000000000108', '00000000-0000-0000-0000-000000000008', 'mira-dsouza', 'Mira D''Souza', 'Consumer and platform growth. Will pay up, but not blindly.', '', 'growth', true, 'broker', 4725, 25.1, 26.3, 8.7, -29.7, 21.5, 62, 8),
  ('00000000-0000-0000-0000-000000000109', '00000000-0000-0000-0000-000000000009', 'dev-narang', 'Dev Narang', 'Dividend plus capital discipline. Slow money, clean notes.', '', 'dividend', false, 'demo', 1185, 12.8, 13.5, 0.9, -12.2, 8.8, 72, 9),
  ('00000000-0000-0000-0000-000000000110', '00000000-0000-0000-0000-000000000010', 'tara-gupta', 'Tara Gupta', 'Mid and small-cap momentum with strict position sizing.', '', 'smallcap', true, 'cas', 2540, 23.4, 24.2, 6.1, -34.8, 25.2, 55, 10)
on conflict (slug) do update set display_name = excluded.display_name, bio = excluded.bio, photo_url = excluded.photo_url, investing_style = excluded.investing_style, verified = excluded.verified, verification_tier = excluded.verification_tier, follower_count = excluded.follower_count, cagr = excluded.cagr, xirr = excluded.xirr, alpha = excluded.alpha, max_drawdown = excluded.max_drawdown, volatility = excluded.volatility, win_rate = excluded.win_rate, sort_order = excluded.sort_order;

insert into portfolios (id, profile_id, name, is_demo) values
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000101', 'Primary', true),
  ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000102', 'Primary', true),
  ('00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000103', 'Primary', true),
  ('00000000-0000-0000-0000-000000000204', '00000000-0000-0000-0000-000000000104', 'Primary', true),
  ('00000000-0000-0000-0000-000000000205', '00000000-0000-0000-0000-000000000105', 'Primary', true),
  ('00000000-0000-0000-0000-000000000206', '00000000-0000-0000-0000-000000000106', 'Primary', true),
  ('00000000-0000-0000-0000-000000000207', '00000000-0000-0000-0000-000000000107', 'Primary', true),
  ('00000000-0000-0000-0000-000000000208', '00000000-0000-0000-0000-000000000108', 'Primary', true),
  ('00000000-0000-0000-0000-000000000209', '00000000-0000-0000-0000-000000000109', 'Primary', true),
  ('00000000-0000-0000-0000-000000000210', '00000000-0000-0000-0000-000000000110', 'Primary', true)
on conflict do nothing;

insert into holdings (id, portfolio_id, ticker, company_name, allocation_pct, avg_buy_price, current_price, holding_since, unrealized_return_pct) values
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000201', 'HDFCBANK', 'HDFC Bank', 22.4, 1180, 1642, '2021-03-11', 39.2),
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000201', 'INFY', 'Infosys', 18.1, 1340, 1512, '2020-11-02', 12.8),
  ('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000201', 'ITC', 'ITC Ltd', 14.7, 210, 438, '2019-06-18', 108.6),
  ('00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000201', 'COALINDIA', 'Coal India', 9.3, 165, 421, '2022-01-24', 155.2),
  ('00000000-0000-0000-0000-000000000305', '00000000-0000-0000-0000-000000000201', 'TATASTEEL', 'Tata Steel', 8, 98, 142, '2022-08-05', 44.9),
  ('00000000-0000-0000-0000-000000000306', '00000000-0000-0000-0000-000000000202', 'KAYNES', 'Kaynes Technology', 16.8, 1750, 4710, '2023-08-04', 169.1),
  ('00000000-0000-0000-0000-000000000307', '00000000-0000-0000-0000-000000000202', 'KPITTECH', 'KPIT Technologies', 14.1, 680, 1455, '2022-09-13', 114),
  ('00000000-0000-0000-0000-000000000308', '00000000-0000-0000-0000-000000000202', 'CDSL', 'CDSL', 12.4, 970, 2280, '2021-12-10', 135.1),
  ('00000000-0000-0000-0000-000000000309', '00000000-0000-0000-0000-000000000202', 'TANLA', 'Tanla Platforms', 7.8, 820, 930, '2024-04-22', 13.4),
  ('00000000-0000-0000-0000-000000000310', '00000000-0000-0000-0000-000000000203', 'INFY', 'Infosys', 14, 1290, 1512, '2023-02-14', 17.2),
  ('00000000-0000-0000-0000-000000000311', '00000000-0000-0000-0000-000000000203', 'TCS', 'Tata Consultancy Services', 13.2, 3120, 3845, '2022-05-03', 23.2),
  ('00000000-0000-0000-0000-000000000312', '00000000-0000-0000-0000-000000000203', 'BAJFINANCE', 'Bajaj Finance', 12.5, 5900, 7120, '2021-09-20', 20.7),
  ('00000000-0000-0000-0000-000000000313', '00000000-0000-0000-0000-000000000203', 'TITAN', 'Titan Company', 9.8, 2200, 3380, '2020-12-01', 53.6)
on conflict do nothing;

insert into transactions (id, portfolio_id, ticker, action, allocation_before, allocation_after, price, transaction_date, is_conviction_alert, alert_text) values
  ('00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000000201', 'COALINDIA', 'buy', 0, 9.3, 0, '2026-06-20', true, 'Arjun opened COALINDIA at 9.3%. New commodity conviction added.'),
  ('00000000-0000-0000-0000-000000000502', '00000000-0000-0000-0000-000000000201', 'ITC', 'add', 9.2, 14.7, 0, '2026-04-11', true, 'Arjun increased ITC from 9.2% to 14.7%. It moved into his top 3 holdings.'),
  ('00000000-0000-0000-0000-000000000503', '00000000-0000-0000-0000-000000000201', 'WIPRO', 'exit', 5.5, 0, 0, '2026-02-03', true, 'Arjun fully exited WIPRO after margins kept slipping.'),
  ('00000000-0000-0000-0000-000000000504', '00000000-0000-0000-0000-000000000202', 'KAYNES', 'add', 8.2, 16.8, 0, '2026-06-18', true, 'Priya increased KAYNES from 8.2% to 16.8%. It is now her largest holding.'),
  ('00000000-0000-0000-0000-000000000505', '00000000-0000-0000-0000-000000000202', 'SUZLON', 'exit', 6.1, 0, 0, '2026-05-21', true, 'Priya fully exited SUZLON after the position doubled.'),
  ('00000000-0000-0000-0000-000000000506', '00000000-0000-0000-0000-000000000202', 'CDSL', 'buy', 0, 7.5, 0, '2026-03-05', true, 'Priya opened CDSL at 7.5%.'),
  ('00000000-0000-0000-0000-000000000507', '00000000-0000-0000-0000-000000000203', 'INFY', 'add', 6, 14, 0, '2026-06-28', true, 'Rahul increased INFY allocation from 6% to 14%. It is now his #1 holding.'),
  ('00000000-0000-0000-0000-000000000508', '00000000-0000-0000-0000-000000000203', 'PAYTM', 'exit', 8.2, 0, 0, '2026-05-12', true, 'Rahul fully exited PAYTM after 14 months.'),
  ('00000000-0000-0000-0000-000000000509', '00000000-0000-0000-0000-000000000203', 'TITAN', 'buy', 0, 6.5, 0, '2026-03-02', true, 'Rahul opened TITAN at 6.5% allocation.'),
  ('00000000-0000-0000-0000-000000000510', '00000000-0000-0000-0000-000000000203', 'TCS', 'reduce', 15.9, 13.2, 0, '2026-01-19', false, null)
on conflict do nothing;

insert into portfolio_growth (id, portfolio_id, month, portfolio, nifty50, sort_order) values
  ('00000000-0000-0000-0000-000000000701', '00000000-0000-0000-0000-000000000201', 'Jan', 100, 100, 1),
  ('00000000-0000-0000-0000-000000000702', '00000000-0000-0000-0000-000000000201', 'Feb', 103, 101, 2),
  ('00000000-0000-0000-0000-000000000703', '00000000-0000-0000-0000-000000000201', 'Mar', 109, 103, 3),
  ('00000000-0000-0000-0000-000000000704', '00000000-0000-0000-0000-000000000201', 'Apr', 121, 106, 4),
  ('00000000-0000-0000-0000-000000000705', '00000000-0000-0000-0000-000000000201', 'May', 128, 108, 5),
  ('00000000-0000-0000-0000-000000000706', '00000000-0000-0000-0000-000000000201', 'Jun', 141, 112, 6),
  ('00000000-0000-0000-0000-000000000713', '00000000-0000-0000-0000-000000000203', 'Jan', 100, 100, 1),
  ('00000000-0000-0000-0000-000000000714', '00000000-0000-0000-0000-000000000203', 'Feb', 104, 101, 2),
  ('00000000-0000-0000-0000-000000000715', '00000000-0000-0000-0000-000000000203', 'Mar', 111, 103, 3),
  ('00000000-0000-0000-0000-000000000716', '00000000-0000-0000-0000-000000000203', 'Apr', 118, 106, 4),
  ('00000000-0000-0000-0000-000000000717', '00000000-0000-0000-0000-000000000203', 'May', 122, 108, 5),
  ('00000000-0000-0000-0000-000000000718', '00000000-0000-0000-0000-000000000203', 'Jun', 137, 112, 6)
on conflict do nothing;
