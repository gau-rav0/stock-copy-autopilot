-- Bind signed payment events to an order this application actually issued.
create table public.checkout_orders (
  razorpay_order_id text primary key,
  follower_user_id uuid not null references public.users(id),
  profile_id uuid not null references public.profiles(id),
  amount_paise bigint not null check (amount_paise > 0),
  currency text not null check (currency = 'INR'),
  processed_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.checkout_orders enable row level security;

create or replace function public.activate_checkout_order(
  p_order_id text, p_user_id uuid, p_profile_id uuid, p_amount_paise bigint, p_currency text
)
returns boolean language plpgsql security definer set search_path = public
as $$
declare
  checkout public.checkout_orders%rowtype;
begin
  select * into checkout from public.checkout_orders where razorpay_order_id = p_order_id for update;
  if not found then raise exception 'Unknown checkout order' using errcode = '22023'; end if;
  if checkout.follower_user_id <> p_user_id or checkout.profile_id <> p_profile_id
    or checkout.amount_paise <> p_amount_paise or checkout.currency <> p_currency then
    raise exception 'Payment does not match checkout order' using errcode = '22023';
  end if;
  -- A replay must not restore a follow the user intentionally deleted later.
  if checkout.processed_at is not null then return false; end if;
  if not exists (select 1 from public.portfolios where profile_id = checkout.profile_id
    and name = 'Primary' and not is_demo) then
    raise exception 'Profile is not available for paid follows' using errcode = '22023';
  end if;
  insert into public.subscriptions(follower_user_id, profile_id, amount_inr, razorpay_subscription_id, status)
  values (checkout.follower_user_id, checkout.profile_id, checkout.amount_paise / 100.0, p_order_id, 'active');
  insert into public.followers(follower_user_id, profile_id, subscribed, subscription_id)
  values (checkout.follower_user_id, checkout.profile_id, true, p_order_id)
  on conflict (follower_user_id, profile_id) do update set subscribed = true, subscription_id = excluded.subscription_id;
  update public.checkout_orders set processed_at = now() where razorpay_order_id = p_order_id;
  return true;
end;
$$;
revoke all on function public.activate_checkout_order(text, uuid, uuid, bigint, text) from public, anon, authenticated;
grant execute on function public.activate_checkout_order(text, uuid, uuid, bigint, text) to service_role;
