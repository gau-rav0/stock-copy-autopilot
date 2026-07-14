-- Keep the public user mirror current so authenticated writes retain valid foreign keys.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, role)
  values (new.id, new.email, 'follower')
  on conflict (id) do update set email = excluded.email;

  return new;
exception
  when unique_violation then
    -- An old seed row can share an email with a real auth user. Preserve the FK chain
    -- by assigning the existing row to the authenticated user ID.
    update public.users set id = new.id where email = new.email;
    return new;
end;
$$;
