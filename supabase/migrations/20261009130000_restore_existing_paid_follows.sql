-- Unfollowing stops updates; it must not require another payment to restore an
-- already purchased entitlement. No browser can invent a subscription record.
drop policy if exists "Users can create free follows only" on public.followers;
create policy "Users can create entitled follows" on public.followers
for insert to authenticated with check (
  (select auth.uid()) = follower_user_id
  and exists (
    select 1 from public.profiles p join public.portfolios po on po.profile_id = p.id
    where p.id = followers.profile_id and po.name = 'Primary' and not po.is_demo
      and (
        (coalesce(p.subscription_fee_inr, 0) = 0 and not subscribed and subscription_id is null)
        or (subscribed and exists (
          select 1 from public.subscriptions s where s.follower_user_id = followers.follower_user_id
            and s.profile_id = followers.profile_id and s.status = 'active'
            and s.razorpay_subscription_id = followers.subscription_id
        ))
      )
  )
);
