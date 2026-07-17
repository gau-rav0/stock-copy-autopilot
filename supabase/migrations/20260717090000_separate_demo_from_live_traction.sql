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

delete from followers as follower
using portfolios as portfolio
where follower.profile_id = portfolio.profile_id
  and portfolio.is_demo = true;

delete from subscriptions as subscription
using portfolios as portfolio
where subscription.profile_id = portfolio.profile_id
  and portfolio.is_demo = true;
