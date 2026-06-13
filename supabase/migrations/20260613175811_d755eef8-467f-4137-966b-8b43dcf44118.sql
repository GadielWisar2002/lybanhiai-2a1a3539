CREATE TABLE IF NOT EXISTS public.books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  chapter_name text NOT NULL DEFAULT '',
  content text NOT NULL,
  grade text,
  subject text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.books ADD COLUMN IF NOT EXISTS title text NOT NULL DEFAULT '';
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS chapter_name text NOT NULL DEFAULT '';
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS content text;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS grade text;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS subject text;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.books ALTER COLUMN title SET DEFAULT '';
ALTER TABLE public.books ALTER COLUMN chapter_name SET DEFAULT '';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.books TO authenticated;
GRANT ALL ON public.books TO service_role;

ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access for authenticated users" ON public.books;
DROP POLICY IF EXISTS "Allow write access for developers" ON public.books;
DROP POLICY IF EXISTS "Authenticated users can read books" ON public.books;
DROP POLICY IF EXISTS "Developer can create books" ON public.books;
DROP POLICY IF EXISTS "Developer can update books" ON public.books;
DROP POLICY IF EXISTS "Developer can delete books" ON public.books;

CREATE POLICY "Authenticated users can read books"
ON public.books FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Developer can create books"
ON public.books FOR INSERT
TO authenticated
WITH CHECK (lower(coalesce(auth.jwt() ->> 'email', '')) = 'debanhivillanueva@colegiomaranatha.edu.mx');

CREATE POLICY "Developer can update books"
ON public.books FOR UPDATE
TO authenticated
USING (lower(coalesce(auth.jwt() ->> 'email', '')) = 'debanhivillanueva@colegiomaranatha.edu.mx')
WITH CHECK (lower(coalesce(auth.jwt() ->> 'email', '')) = 'debanhivillanueva@colegiomaranatha.edu.mx');

CREATE POLICY "Developer can delete books"
ON public.books FOR DELETE
TO authenticated
USING (lower(coalesce(auth.jwt() ->> 'email', '')) = 'debanhivillanueva@colegiomaranatha.edu.mx');

CREATE INDEX IF NOT EXISTS books_grade_idx ON public.books (grade);
CREATE INDEX IF NOT EXISTS books_subject_idx ON public.books (subject);
CREATE INDEX IF NOT EXISTS books_created_at_idx ON public.books (created_at DESC);

CREATE OR REPLACE FUNCTION public.set_books_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_books_updated_at ON public.books;
CREATE TRIGGER set_books_updated_at
BEFORE UPDATE ON public.books
FOR EACH ROW
EXECUTE FUNCTION public.set_books_updated_at();