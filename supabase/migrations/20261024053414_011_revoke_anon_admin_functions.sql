/*
# Revoke anon execute on admin SECURITY DEFINER functions

## Purpose
The security advisor flagged that the admin role functions (admin_role_tier,
current_admin_role, has_admin_role, active_super_admin_count) are callable
by the anon role. These functions should only be executable by authenticated
users since they check admin privileges.

## Changes
- REVOKE EXECUTE on all 5 admin functions from PUBLIC and anon
- GRANT EXECUTE to authenticated only (the frontend uses the anon key but
  these functions only return meaningful results with an authenticated session)
*/

REVOKE EXECUTE ON FUNCTION public.admin_role_tier(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_admin_role() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_admin_role(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.active_super_admin_count() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.admin_role_tier(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_admin_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_admin_role(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.active_super_admin_count() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
