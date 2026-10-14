-- Demo records illustrate the interface; they must never be counted as live
-- verification, followers, revenue, or marketplace traction.

update profiles as profile
set
  verified = false,
  follower_count = 0,
  subscription_fee_inr = 0
where exists (
  select 1
  from portfolios as portfolio
  where portfolio.profile_id = profile.id
    and portfolio.is_demo = true
);

-- Keep legacy demo relationships recoverable, without counting them as live use.
create table if not exists public.demo_follow_archive (like public.followers including defaults);
create unique index if not exists demo_follow_archive_id_idx on public.demo_follow_archive(id);
alter table public.demo_follow_archive enable row level security;
grant all on public.demo_follow_archive to service_role;
insert into public.demo_follow_archive
select follower.* from public.followers follower
where exists(select 1 from public.portfolios portfolio where portfolio.profile_id=follower.profile_id and portfolio.is_demo)
on conflict(id) do nothing;

create table if not exists public.demo_subscription_archive (like public.subscriptions including defaults);
create unique index if not exists demo_subscription_archive_id_idx on public.demo_subscription_archive(id);
alter table public.demo_subscription_archive enable row level security;
grant all on public.demo_subscription_archive to service_role;
insert into public.demo_subscription_archive
select subscription.* from public.subscriptions subscription
where exists(select 1 from public.portfolios portfolio where portfolio.profile_id=subscription.profile_id and portfolio.is_demo)
on conflict(id) do nothing;

delete from followers as follower
using portfolios as portfolio
where follower.profile_id = portfolio.profile_id
  and portfolio.is_demo = true;

delete from subscriptions as subscription
using portfolios as portfolio
where subscription.profile_id = portfolio.profile_id
  and portfolio.is_demo = true;
