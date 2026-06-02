alter table public.streaks add column if not exists coins int not null default 0;
alter table public.streaks add column if not exists unlocked_games text[] not null default '{}';

alter table public.profiles add column if not exists active_blook_id text;
alter table public.profiles add column if not exists avatar_config jsonb not null default '{}'::jsonb;
alter table public.profiles add column if not exists unlocked_avatar_items text[] not null default '{}';

create table if not exists public.user_blooks (
  user_id uuid references auth.users not null,
  blook_id text not null,
  unlocked_at timestamp with time zone default now() not null,
  primary key (user_id, blook_id)
);

grant select, insert, update, delete on public.user_blooks to authenticated;
grant all on public.user_blooks to service_role;

alter table public.user_blooks enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='user_blooks' and policyname='user_blooks_select_own') then
    create policy "user_blooks_select_own" on public.user_blooks for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='user_blooks' and policyname='user_blooks_insert_own') then
    create policy "user_blooks_insert_own" on public.user_blooks for insert with check (auth.uid() = user_id);
  end if;
end $$;