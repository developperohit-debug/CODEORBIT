/*
# Revoke anon execute on SECURITY DEFINER functions

## Summary
The database security advisor identified that four SECURITY DEFINER functions
are executable by the `anon` role. Since CodeOrbit requires authentication,
these functions should only be executable by `authenticated` users.

## Changes
- Revoke EXECUTE from `anon` on: `increment_upvote`, `decrement_upvote`, `is_admin`, `set_updated_at`
- Keep EXECUTE on `authenticated` for all four functions
- `is_admin` is used in RLS policies — authenticated users need it to pass policy checks
- `increment_upvote` / `decrement_upvote` are called from the discussions page — authenticated only
- `set_updated_at` is a trigger helper — not directly called but kept safe

## Security
- Reduces attack surface: unauthenticated requests can no longer invoke these functions
- All app functionality preserved for signed-in users
*/

REVOKE EXECUTE ON FUNCTION public.increment_upvote(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.decrement_upvote(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon;