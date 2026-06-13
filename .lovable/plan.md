## Goal
Resolve the runtime error shown in the screenshot: `Could not find the table 'public.books' in the schema cache`, so the Book Admin page can save/list study texts and Prep can generate quizzes from them.

## Plan
1. **Create/repair the backend `books` table**
   - Add a migration that creates `public.books` if it is missing.
   - Include the columns already expected by the app: `id`, `title`, `chapter_name`, `content`, `grade`, `subject`, `created_at`, and `updated_at`.
   - Add indexes for `grade`, `subject`, and `created_at`.

2. **Add required Data API permissions and RLS**
   - Grant `SELECT` to authenticated users so students can read available study texts.
   - Grant write permissions to authenticated users at the table level, then restrict actual writes with row-level policies.
   - Grant full access to the service role.
   - Enable RLS.

3. **Fix the broken developer-only write policy**
   - The existing migration references `profiles.role`, but the current `profiles` table does not expose that column.
   - Replace that policy with a safe backend function/policy that allows writes only for the configured developer email used elsewhere in the app.
   - Keep anonymous users blocked.

4. **Align server functions with the table**
   - Keep `listBooks`, `createBookChapter`, `updateBookChapter`, and `deleteBookChapter` using the authenticated server function pattern.
   - If needed, adjust direct edit fetching in the admin page to use `.maybeSingle()` to avoid hard errors when a book is deleted or missing.

5. **Validate**
   - Run the backend linter after the migration.
   - Verify the app no longer reports the missing table error and that the admin page can save/list book texts.