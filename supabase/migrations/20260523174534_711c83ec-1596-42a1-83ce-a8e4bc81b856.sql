
-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  language text not null default 'es',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

-- user_profile_data (onboarding answers)
create table public.user_profile_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  hobbies text[] not null default '{}',
  skills text[] not null default '{}',
  interests text not null default '',
  favorite_subjects jsonb not null default '[]'::jsonb,
  budget_monthly numeric,
  budget_currency text default 'USD',
  country text,
  university_type text,
  updated_at timestamptz not null default now()
);
alter table public.user_profile_data enable row level security;
create policy "upd_select_own" on public.user_profile_data for select using (auth.uid() = user_id);
create policy "upd_upsert_own" on public.user_profile_data for insert with check (auth.uid() = user_id);
create policy "upd_update_own" on public.user_profile_data for update using (auth.uid() = user_id);

-- recommendations
create table public.recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  career_name text not null,
  match_score int not null,
  reasoning text not null,
  tags text[] not null default '{}',
  universities jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.recommendations enable row level security;
create policy "rec_select_own" on public.recommendations for select using (auth.uid() = user_id);
create policy "rec_insert_own" on public.recommendations for insert with check (auth.uid() = user_id);
create policy "rec_delete_own" on public.recommendations for delete using (auth.uid() = user_id);
create index on public.recommendations (user_id, created_at desc);

-- quizzes (generated content cached, lecture pública autenticada)
create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  category text not null,
  topic text not null,
  language text not null default 'es',
  questions jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.quizzes enable row level security;
create policy "quiz_select_own_or_global" on public.quizzes for select using (user_id is null or auth.uid() = user_id);
create policy "quiz_insert_own" on public.quizzes for insert with check (auth.uid() = user_id);

-- quiz_attempts
create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  score int not null,
  total int not null,
  answers jsonb not null default '[]'::jsonb,
  xp_earned int not null default 0,
  completed_at timestamptz not null default now()
);
alter table public.quiz_attempts enable row level security;
create policy "qa_select_own" on public.quiz_attempts for select using (auth.uid() = user_id);
create policy "qa_insert_own" on public.quiz_attempts for insert with check (auth.uid() = user_id);

-- streaks
create table public.streaks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_active_date date,
  total_xp int not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.streaks enable row level security;
create policy "streak_select_own" on public.streaks for select using (auth.uid() = user_id);
create policy "streak_upsert_own" on public.streaks for insert with check (auth.uid() = user_id);
create policy "streak_update_own" on public.streaks for update using (auth.uid() = user_id);

-- handle_new_user trigger -> creates profile + streak row
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.streaks (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
