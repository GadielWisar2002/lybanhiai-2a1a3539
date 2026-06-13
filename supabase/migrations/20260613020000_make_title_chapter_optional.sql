-- Make title and chapter_name optional in books table
alter table public.books alter column title drop not null;
alter table public.books alter column title set default '';
alter table public.books alter column chapter_name drop not null;
alter table public.books alter column chapter_name set default '';
