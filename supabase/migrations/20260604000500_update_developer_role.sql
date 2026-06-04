-- Update the specific developer account role to developer
update public.profiles
set role = 'developer'
where id in (
  select id from auth.users 
  where email = 'debanhivillanueva@colegiomaranatha.edu.mx'
);
