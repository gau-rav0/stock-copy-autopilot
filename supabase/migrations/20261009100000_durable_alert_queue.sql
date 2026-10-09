-- Persist recipients in the transaction that creates an alert. Serverless
-- shutdown or missing provider configuration cannot lose the initial work.
create or replace function public.queue_conviction_alert()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.alert_delivery_attempts(transaction_id, follower_user_id, recipient_email)
  select new.id, f.follower_user_id, u.email
  from public.portfolios po join public.followers f on f.profile_id = po.profile_id
  join public.users u on u.id = f.follower_user_id
  left join public.notification_preferences np on np.user_id = u.id
  where po.id = new.portfolio_id and not po.is_demo
    and coalesce(np.trade_alerts_email, true)
  on conflict (transaction_id, follower_user_id) do nothing;
  return new;
end;
$$;
revoke all on function public.queue_conviction_alert() from public, anon, authenticated;
-- Replace the legacy pg_net trigger with a durable outbox. Application after()
-- runs delivery immediately; cron drains anything it could not complete.
drop trigger if exists conviction_alert_trigger on public.transactions;
create trigger conviction_alert_trigger after insert on public.transactions
for each row when (new.is_conviction_alert = true) execute function public.queue_conviction_alert();

create or replace function public.claim_alert_deliveries(p_transaction_id uuid)
returns table(follower_user_id uuid, recipient_email text, attempts integer, last_attempt_at timestamptz)
language plpgsql security definer set search_path = public
as $$
begin
  -- Re-check current consent and follow membership at send time.
  update public.alert_delivery_attempts d set status = 'skipped', updated_at = now()
  where d.transaction_id = p_transaction_id and d.status in ('queued', 'failed')
    and (not exists (
      select 1 from public.followers f join public.portfolios po on po.profile_id = f.profile_id
      join public.transactions t on t.portfolio_id = po.id
      where t.id = d.transaction_id and f.follower_user_id = d.follower_user_id and not po.is_demo
    ) or exists (select 1 from public.notification_preferences np
      where np.user_id = d.follower_user_id and not np.trade_alerts_email));

  return query
  with candidates as (
    select d.id from public.alert_delivery_attempts d
    where d.transaction_id = p_transaction_id and d.status in ('queued', 'failed') and d.attempts < 3
      and (d.last_attempt_at is null or d.last_attempt_at < now() - interval '10 minutes')
    order by d.follower_user_id limit 500 for update skip locked
  )
  update public.alert_delivery_attempts d set status = 'queued', attempts = d.attempts + 1,
    last_attempt_at = now(), updated_at = now(), error_message = null
  from candidates c where d.id = c.id
  returning d.follower_user_id, d.recipient_email, d.attempts, d.last_attempt_at;
end;
$$;
revoke all on function public.claim_alert_deliveries(uuid) from public, anon, authenticated;
grant execute on function public.claim_alert_deliveries(uuid) to service_role;
