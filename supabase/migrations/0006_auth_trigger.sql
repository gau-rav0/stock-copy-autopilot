-- Link Supabase Auth to our custom users table

-- Create a function to handle new user signups
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, role)
  values (new.id, new.email, 'follower')
  on conflict (id) do nothing;
  
  return new;
end;
$$;

-- Trigger the function every time a user is created
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Also ensure we change the foreign keys for followers and notifications to reference auth.users if needed, 
-- but since we are mirroring auth.users.id into public.users.id, the existing foreign key to public.users(id) works perfectly!
