-- Add role column to profiles
alter table public.profiles add column if not exists role text not null default 'student';

-- Re-create the handle_new_user trigger function to automatically flag dev accounts based on email domain
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    case 
      when new.email like '%debanhivillanuevacolegiomaranatha.edu.mx%' 
        or new.email like '%admin%' 
        or new.email = 'debanhi@colegio.edu.mx' 
      then 'developer' 
      else 'student' 
    end
  )
  on conflict (id) do update set
    role = case 
      when new.email like '%debanhivillanuevacolegiomaranatha.edu.mx%' 
        or new.email like '%admin%' 
        or new.email = 'debanhi@colegio.edu.mx' 
      then 'developer' 
      else profiles.role 
    end;

  insert into public.streaks (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$;

-- Upgrade existing accounts with the domain of interest to 'developer' role
update public.profiles
set role = 'developer'
where id in (
  select id from auth.users 
  where email like '%debanhivillanuevacolegiomaranatha.edu.mx%' 
     or email like '%admin%' 
     or email = 'debanhi@colegio.edu.mx'
);
