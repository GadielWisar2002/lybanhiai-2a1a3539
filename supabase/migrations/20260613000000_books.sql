-- Create books table
create table if not exists public.books (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  chapter_name text not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.books enable row level security;

-- Policy for select (all authenticated users can read books to take quizzes)
create policy "Allow read access for authenticated users"
  on public.books for select
  to authenticated
  using (true);

-- Policy for insert/update/delete (only users with 'developer' role can manage books)
create policy "Allow write access for developers"
  on public.books for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'developer'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'developer'
    )
  );
