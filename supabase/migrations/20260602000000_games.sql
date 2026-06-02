-- Add coins column to streaks
alter table public.streaks add column if not exists coins int not null default 0;

-- Add active_blook_id to profiles
alter table public.profiles add column if not exists active_blook_id text;

-- Create user_blooks table
create table if not exists public.user_blooks (
  user_id uuid references auth.users not null,
  blook_id text not null,
  unlocked_at timestamp with time zone default now() not null,
  primary key (user_id, blook_id)
);

-- Enable Row Level Security
alter table public.user_blooks enable row level security;

-- Setup RLS Policies for user_blooks
create policy "user_blooks_select_own" on public.user_blooks
  for select using (auth.uid() = user_id);

create policy "user_blooks_insert_own" on public.user_blooks
  for insert with check (auth.uid() = user_id);
