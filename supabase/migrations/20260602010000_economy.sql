-- Add unlocked_games column to streaks table
alter table public.streaks add column if not exists unlocked_games text[] not null default '{}';
