-- The Data API is a security boundary: direct authenticated inserts must not
-- bypass the paid-follow check performed by the application route.

drop policy if exists "Users can manage own follows" on public.followers;
drop policy if exists "Users can view own follows" on public.followers;
drop policy if exists "Users can create free follows only" on public.followers;
drop policy if exists "Users can delete own follows" on public.followers;

create policy "Users can view own follows" on public.followers for select to authenticated
  using ((select auth.uid()) = follower_user_id);

create policy "Users can create free follows only" on public.followers for insert to authenticated
  with check (
    (select auth.uid()) = follower_user_id
    and not exists (
      select 1 from public.profiles as profile
      where profile.id = profile_id
        and coalesce(profile.subscription_fee_inr, 0) > 0
    )
  );

create policy "Users can delete own follows" on public.followers for delete to authenticated
  using ((select auth.uid()) = follower_user_id);

-- Alert records are server-generated from transactions; clients do not need
-- to create arbitrary rows in their own feed.
drop policy if exists "Users can insert their own notifications" on public.notifications;
