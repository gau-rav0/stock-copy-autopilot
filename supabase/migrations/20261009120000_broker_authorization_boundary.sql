-- Only a reviewed provider adapter can assign active status or permissions.
-- The authenticated preference RPC can change the label, never authorization.
drop policy if exists "Users manage their own broker connection metadata" on public.broker_connections;
create policy "Users read their own broker connection metadata" on public.broker_connections
for select to authenticated using ((select auth.uid()) = user_id);

create or replace function public.save_broker_preference(p_broker text, p_purpose text, p_account_label text)
returns setof public.broker_connections
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if p_broker not in ('zerodha','upstox','angelone','groww','other')
    or p_purpose not in ('creator','follower') or length(p_account_label) > 80 then
    raise exception 'Invalid broker preference' using errcode = '22023';
  end if;
  if p_purpose = 'creator' and not exists (
    select 1 from public.profiles p join public.portfolios po on po.profile_id = p.id
    where p.user_id = auth.uid() and p.verified and po.name = 'Primary' and not po.is_demo
  ) then raise exception 'Verified creator required' using errcode = '42501'; end if;
  return query
  insert into public.broker_connections(user_id, broker, purpose, account_label)
  values (auth.uid(), p_broker, p_purpose, nullif(trim(p_account_label), ''))
  on conflict (user_id, broker, purpose) do update
    set account_label = excluded.account_label, updated_at = now()
  returning *;
end;
$$;
revoke all on function public.save_broker_preference(text,text,text) from public, anon;
grant execute on function public.save_broker_preference(text,text,text) to authenticated;
