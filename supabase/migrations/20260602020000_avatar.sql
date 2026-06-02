-- Add avatar_config and unlocked_avatar_items to profiles table
alter table public.profiles add column if not exists avatar_config jsonb not null default '{}'::jsonb;
alter table public.profiles add column if not exists unlocked_avatar_items text[] not null default '{}';
