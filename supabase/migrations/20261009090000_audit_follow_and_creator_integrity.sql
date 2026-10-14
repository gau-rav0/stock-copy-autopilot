-- Capture endpoints validate inputs and write through the service role. The
-- public Data API must not bypass validation or assign review fields directly.
drop policy if exists "Anyone can submit roast leads" on public.roast_leads;
drop policy if exists "Anyone can submit follow intents" on public.follow_intents;
drop policy if exists "Anyone can submit creator applications" on public.creator_applications;
drop policy if exists "Anyone can submit parsed creator holdings" on public.creator_application_holdings;
drop policy if exists "Anyone can join waitlist" on public.waitlist_signups;

drop policy if exists "Users can create free follows only" on public.followers;
create policy "Users can create free follows only" on public.followers
for insert to authenticated with check (
  (select auth.uid()) = follower_user_id
  and subscribed = false and subscription_id is null
  and exists (
    select 1 from public.profiles p
    join public.portfolios portfolio on portfolio.profile_id = p.id
    where p.id = followers.profile_id
      and coalesce(p.subscription_fee_inr, 0) = 0
      and portfolio.name = 'Primary' and portfolio.is_demo = false
  )
);

-- Followers cannot UPDATE profiles under RLS. The trigger needs narrowly
-- scoped definer privileges to maintain the public count after a user follows.
alter function public.sync_profile_follower_count() security definer;
alter function public.sync_profile_follower_count() set search_path = public;
revoke all on function public.sync_profile_follower_count() from public, anon, authenticated;
update public.profiles p set follower_count = (
  select count(*) from public.followers f where f.profile_id = p.id
) where exists (select 1 from public.portfolios po where po.profile_id = p.id and not po.is_demo);

alter table public.profiles add column if not exists approved_application_id uuid
  unique references public.creator_applications(id);

-- All approval writes commit together. Locking prevents concurrent reviews
-- from creating two profiles, and repeated requests return the original result.
create or replace function public.approve_creator_application(p_application_id uuid)
returns table (profile_id uuid, slug text, verified boolean)
language plpgsql security definer set search_path = public
as $$
declare
  application public.creator_applications%rowtype;
  creator public.users%rowtype;
  new_profile public.profiles%rowtype;
  portfolio_id uuid;
  display_name text;
  profile_slug text;
  cas_reviewed boolean;
begin
  if not exists (select 1 from public.users where id = auth.uid() and role = 'admin') then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  select * into application from public.creator_applications where id = p_application_id for update;
  if not found then raise exception 'Application not found' using errcode = 'P0002'; end if;

  select * into new_profile from public.profiles where approved_application_id = application.id;
  if found and application.status = 'Accepted' then
    return query select new_profile.id, new_profile.slug, new_profile.verified;
    return;
  end if;
  if application.status <> 'Pending' then
    raise exception 'Application is not pending review' using errcode = '22023';
  end if;

  select * into creator from public.users where lower(email) = lower(application.email) for update;
  if not found then raise exception 'Creator must sign up with the application email first' using errcode = 'P0002'; end if;
  if exists (select 1 from public.profiles where user_id = creator.id) then
    raise exception 'Creator already has a profile' using errcode = '23505';
  end if;

  display_name := coalesce(nullif(trim(application.creator_name), ''), nullif(trim(application.name), ''), split_part(application.email, '@', 1));
  profile_slug := left(trim(both '-' from regexp_replace(lower(display_name), '[^a-z0-9]+', '-', 'g')), 60);
  if profile_slug = '' then profile_slug := 'creator'; end if;
  profile_slug := profile_slug || '-' || replace(application.id::text, '-', '');
  cas_reviewed := application.method = 'cas' and application.parse_status = 'parsed_pending_review'
    and jsonb_array_length(application.parsed_holdings) > 0;

  insert into public.profiles(user_id, slug, display_name, investing_style, verified, verification_tier, follower_count, subscription_fee_inr, approved_application_id)
  values (creator.id, profile_slug, display_name, 'growth', cas_reviewed,
    case when cas_reviewed then 'cas'::public.verification_tier else 'demo'::public.verification_tier end,
    0, 0, application.id) returning * into new_profile;
  insert into public.portfolios(profile_id, name, is_demo)
  values (new_profile.id, 'Primary', false) returning id into portfolio_id;

  insert into public.holdings(portfolio_id, ticker, company_name, allocation_pct, current_price)
  select portfolio_id, coalesce(nullif(h->>'symbol', ''), h->>'name', 'UNKNOWN'),
    coalesce(h->>'name', h->>'symbol', 'Unknown holding'),
    coalesce((h->>'weightPct')::numeric, (h->>'weight_pct')::numeric, 0),
    coalesce((h->>'marketValue')::numeric, (h->>'market_value')::numeric) / nullif((h->>'quantity')::numeric, 0)
  from jsonb_array_elements(application.parsed_holdings) h;

  update public.users set role = 'creator' where id = creator.id and role <> 'admin';
  update public.creator_applications set status = 'Accepted' where id = application.id;
  return query select new_profile.id, new_profile.slug, new_profile.verified;
end;
$$;
revoke all on function public.approve_creator_application(uuid) from public, anon;
grant execute on function public.approve_creator_application(uuid) to authenticated;
