-- Private statement evidence and explicit, attributable review.
alter table public.creator_applications
  add column if not exists owner_user_id uuid references auth.users(id),
  add column if not exists evidence_path text,
  add column if not exists evidence_sha256 text,
  add column if not exists evidence_uploaded_at timestamptz,
  add column if not exists evidence_reviewed_at timestamptz,
  add column if not exists evidence_reviewed_by uuid references public.users(id),
  add column if not exists evidence_review_notes text,
  add column if not exists statement_as_of date;
alter table public.profiles
  add column if not exists evidence_reviewed_at timestamptz,
  add column if not exists evidence_statement_as_of date,
  add column if not exists evidence_updated_at timestamptz;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('creator-evidence','creator-evidence',false,4194304,array['application/pdf','text/plain'])
on conflict(id) do update set public=false,file_size_limit=4194304,allowed_mime_types=excluded.allowed_mime_types;

create table public.creator_evidence_access_logs (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.creator_applications(id) on delete cascade,
  reviewer_id uuid not null references public.users(id),
  action text not null check(action in ('view','approve')),
  created_at timestamptz not null default now()
);
alter table public.creator_evidence_access_logs enable row level security;
create policy "Admins can inspect evidence access" on public.creator_evidence_access_logs
for select to authenticated using(exists(select 1 from public.users where id=auth.uid() and role='admin'));
grant select on public.creator_evidence_access_logs to authenticated;
grant all on public.creator_evidence_access_logs to service_role;

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
  cas_reviewed := application.method = 'cas'
    and application.evidence_reviewed_at is not null
    and application.evidence_reviewed_by = auth.uid()
    and application.evidence_path is not null and application.owner_user_id = creator.id
    and application.parse_status = 'parsed_pending_review' and jsonb_array_length(application.parsed_holdings) > 0;
  if application.method = 'cas' and not cas_reviewed then
    raise exception 'Open and explicitly review the original statement before publishing' using errcode = '22023';
  end if;

  insert into public.profiles(user_id, slug, display_name, investing_style, verified, verification_tier, follower_count, subscription_fee_inr, approved_application_id)
  values (creator.id, profile_slug, display_name, 'growth', cas_reviewed,
    case when cas_reviewed then 'cas'::public.verification_tier else 'demo'::public.verification_tier end,
    0, 0, application.id) returning * into new_profile;
  update public.profiles set evidence_reviewed_at=application.evidence_reviewed_at,
    evidence_statement_as_of=application.statement_as_of,evidence_updated_at=now() where id=new_profile.id;
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

create or replace function public.review_creator_application(
  p_application_id uuid, p_evidence_confirmed boolean, p_review_notes text, p_statement_as_of date
) returns table(profile_id uuid,slug text,verified boolean)
language plpgsql security definer set search_path=public as $$
declare application public.creator_applications%rowtype;
begin
  if not exists(select 1 from public.users where id=auth.uid() and role='admin') then
    raise exception 'Admin access required' using errcode='42501';
  end if;
  select * into application from public.creator_applications where id=p_application_id for update;
  if not found then raise exception 'Application not found' using errcode='P0002'; end if;
  if application.status='Accepted' then
    return query select * from public.approve_creator_application(p_application_id);
    return;
  end if;
  if application.method='cas' then
    if not coalesce(p_evidence_confirmed,false) or application.evidence_path is null
      or application.owner_user_id is null or application.evidence_sha256 !~ '^[a-f0-9]{64}$'
      or application.evidence_sha256 is null or p_statement_as_of is null or p_statement_as_of>current_date
      or length(trim(coalesce(p_review_notes,'')))<10
      or not exists(select 1 from storage.objects where bucket_id='creator-evidence' and name=application.evidence_path)
      or not exists(select 1 from public.creator_evidence_access_logs where application_id=p_application_id and reviewer_id=auth.uid() and action='view') then
      raise exception 'Original evidence, statement date, reviewer notes and a confirmed review are required' using errcode='22023';
    end if;
  end if;
  update public.creator_applications set evidence_reviewed_at=now(),evidence_reviewed_by=auth.uid(),
    evidence_review_notes=left(trim(coalesce(p_review_notes,'')),3000),statement_as_of=p_statement_as_of
    where id=p_application_id;
  insert into public.creator_evidence_access_logs(application_id,reviewer_id,action) values(p_application_id,auth.uid(),'approve');
  return query select * from public.approve_creator_application(p_application_id);
end;
$$;
revoke all on function public.review_creator_application(uuid,boolean,text,date) from public,anon;
grant execute on function public.review_creator_application(uuid,boolean,text,date) to authenticated;

create table public.product_events (
  id uuid primary key default gen_random_uuid(),
  event text not null check(event in ('hero_roast','sample_start','roast_started','roast_success','roast_error','early_access','waitlist_success','waitlist_existing','creator_started','application_success','application_existing','preview_open')),
  created_at timestamptz not null default now()
);
alter table public.product_events enable row level security;
create policy "Admins can read aggregate events" on public.product_events for select to authenticated
using(exists(select 1 from public.users where id=auth.uid() and role='admin'));
grant select on public.product_events to authenticated;
grant all on public.product_events to service_role;
