-- Add grade and subject columns to books table
alter table public.books add column if not exists grade text;
alter table public.books add column if not exists subject text;

-- Add indexes for performance when filtering by grade and subject
create index if not exists books_grade_idx on public.books(grade);
create index if not exists books_subject_idx on public.books(subject);
