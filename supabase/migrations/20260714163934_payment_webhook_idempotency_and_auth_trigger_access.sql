-- Webhooks are delivered at least once. Keep a single subscription record per order.
create unique index if not exists subscriptions_razorpay_subscription_id_unique
  on public.subscriptions (razorpay_subscription_id)
  where razorpay_subscription_id is not null;

-- This SECURITY DEFINER trigger function is for auth.users only, never the Data API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
