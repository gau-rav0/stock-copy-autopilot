-- Auth users created before the mirror trigger must also satisfy public.users foreign keys.
insert into public.users (id, email, role)
select id, email, 'follower'::user_role
from auth.users
where email is not null
on conflict (id) do update
set email = excluded.email;
