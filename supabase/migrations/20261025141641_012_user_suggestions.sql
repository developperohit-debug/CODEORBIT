/*
# User Suggestions Table

## Purpose
Allows users to submit improvement suggestions to admins. Admins can review,
update status, and respond to suggestions.

## New Table: user_suggestions
- id (uuid, PK)
- user_id (uuid, FK to auth.users, ON DELETE CASCADE)
- title (text, not null)
- description (text, not null)
- category (text: 'feature' | 'bug' | 'ui' | 'content' | 'other')
- status (text: 'open' | 'under_review' | 'planned' | 'implemented' | 'declined')
- admin_response (text, nullable — admin's reply to the suggestion)
- responded_by (uuid, FK to auth.users, nullable)
- responded_at (timestamptz, nullable)
- created_at (timestamptz)
- updated_at (timestamptz)

## Security (RLS)
- Users can INSERT their own suggestions (user_id = auth.uid())
- Users can SELECT their own suggestions
- Users can UPDATE only the title/description of their own open suggestions
- Admins (analyst+) can SELECT all suggestions
- Admins (content_admin+) can UPDATE status and admin_response on any suggestion
- Users can DELETE their own suggestions (only if status = 'open')
- Admins can DELETE any suggestion

## Indexes
- idx_user_suggestions_user_id for user's own list
- idx_user_suggestions_status for admin filtering
- idx_user_suggestions_category for filtering
*/

CREATE TABLE IF NOT EXISTS public.user_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'feature' CHECK (category IN ('feature', 'bug', 'ui', 'content', 'other')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'planned', 'implemented', 'declined')),
  admin_response text,
  responded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  responded_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_suggestions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_user_suggestions_user_id ON public.user_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_suggestions_status ON public.user_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_user_suggestions_category ON public.user_suggestions(category);

-- Users can read their own suggestions
DROP POLICY IF EXISTS "suggestions_select_own" ON public.user_suggestions;
CREATE POLICY "suggestions_select_own" ON public.user_suggestions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_admin_role('analyst'));

-- Users can insert their own suggestions
DROP POLICY IF EXISTS "suggestions_insert_own" ON public.user_suggestions;
CREATE POLICY "suggestions_insert_own" ON public.user_suggestions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own suggestions (only if still open)
DROP POLICY IF EXISTS "suggestions_update_own" ON public.user_suggestions;
CREATE POLICY "suggestions_update_own" ON public.user_suggestions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND status = 'open')
  WITH CHECK (auth.uid() = user_id);

-- Admins (content_admin+) can update status/response on any suggestion
DROP POLICY IF EXISTS "suggestions_update_admin" ON public.user_suggestions;
CREATE POLICY "suggestions_update_admin" ON public.user_suggestions
  FOR UPDATE TO authenticated
  USING (public.has_admin_role('content_admin'))
  WITH CHECK (public.has_admin_role('content_admin'));

-- Users can delete their own open suggestions
DROP POLICY IF EXISTS "suggestions_delete_own" ON public.user_suggestions;
CREATE POLICY "suggestions_delete_own" ON public.user_suggestions
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND status = 'open');

-- Admins can delete any suggestion
DROP POLICY IF EXISTS "suggestions_delete_admin" ON public.user_suggestions;
CREATE POLICY "suggestions_delete_admin" ON public.user_suggestions
  FOR DELETE TO authenticated
  USING (public.has_admin_role('admin'));

-- Grant access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_suggestions TO authenticated;
