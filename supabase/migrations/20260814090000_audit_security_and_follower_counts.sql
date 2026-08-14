-- Audit fixes: authenticated self-read, admin review access, notification ownership,
-- and durable non-demo follower counts.

drop policy if exists "Users can read own row" on public.users;
create policy "Users can read own row" on public.users for select to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Admins can view creator applications" on public.creator_applications;
create policy "Admins can view creator applications" on public.creator_applications for select to authenticated
  using (exists (
    select 1 from public.users
    where users.id = (select auth.uid()) and users.role = 'admin'
  ));

drop policy if exists "System can insert notifications" on public.notifications;
drop policy if exists "Users can insert their own notifications" on public.notifications;
create policy "Users can insert their own notifications" on public.notifications for insert to authenticated
  with check ((select auth.uid()) = follower_user_id);

create or replace function public.sync_profile_follower_count()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update profiles set follower_count = follower_count + 1 where id = new.profile_id;
    return new;
  end if;

  update profiles set follower_count = greatest(follower_count - 1, 0) where id = old.profile_id;
  return old;
end;
$$;

drop trigger if exists followers_sync_profile_follower_count on public.followers;
create trigger followers_sync_profile_follower_count
after insert or delete on public.followers
for each row execute function public.sync_profile_follower_count();

update public.profiles as profile
set follower_count = (
  select count(*) from public.followers as follower where follower.profile_id = profile.id
)
where exists (
  select 1 from public.portfolios as portfolio
  where portfolio.profile_id = profile.id and portfolio.is_demo = false
);
