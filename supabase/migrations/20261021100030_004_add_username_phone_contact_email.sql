/*
# Add username, phone, and contact_email to profiles

1. Modified Tables
- `profiles`
  - `username` (text, unique, nullable initially for existing rows) — the app-visible login handle (e.g. "jane_dev"). Lowercase, 3-20 chars, alphanumeric + underscore.
  - `phone` (text, nullable) — optional phone number the user can add later.
  - `contact_email` (text, nullable) — optional contact email the user can add later (separate from auth email).
  - Unique index on `username` to enforce uniqueness at the DB level.
2. Security
- No RLS policy changes — existing profile policies already cover the new columns.
3. Important Notes
- `username` is nullable so existing rows are not broken, but new signups will always set it.
- The unique constraint is partial (WHERE username IS NOT NULL) so multiple NULLs are allowed.
*/

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'username') THEN
    ALTER TABLE public.profiles ADD COLUMN username text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'phone') THEN
    ALTER TABLE public.profiles ADD COLUMN phone text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'contact_email') THEN
    ALTER TABLE public.profiles ADD COLUMN contact_email text;
  END IF;
END $$;

-- Unique index on username (partial, so NULLs don't conflict)
DROP INDEX IF EXISTS idx_profiles_username_unique;
CREATE UNIQUE INDEX idx_profiles_username_unique ON public.profiles (username) WHERE username IS NOT NULL;
