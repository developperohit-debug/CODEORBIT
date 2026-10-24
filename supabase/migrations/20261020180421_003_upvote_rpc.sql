/*
# Add upvote increment/decrement RPC functions

Adds two SECURITY DEFINER functions for atomic upvote count updates on discussions.
These are called from the frontend when a user upvotes/un-upvotes a discussion.
*/

CREATE OR REPLACE FUNCTION public.increment_upvote(d_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.discussions SET upvotes = upvotes + 1 WHERE id = d_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_upvote(d_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.discussions SET upvotes = GREATEST(upvotes - 1, 0) WHERE id = d_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_upvote(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_upvote(uuid) TO authenticated;
