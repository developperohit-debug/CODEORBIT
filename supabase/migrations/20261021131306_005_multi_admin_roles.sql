/*
# Multi-Administrator Role System

## Purpose
Replaces the single binary is_admin() check with a 5-role hierarchy:
super_admin, admin, content_admin, analyst, and regular user.

## New Tables
- admin_roles — stores each user's admin role assignment (one role per user)
- admin_invitations — single-use, expiring invitations for new admins

## Role Hierarchy (tier numbers for comparison)
  1. super_admin (tier 4) — full access, can manage other admins
  2. admin (tier 3) — content + user management
  3. content_admin (tier 2) — DSA content management only
  4. analyst (tier 1) — read-only analytics
  5. regular user (tier 0) — no admin access

## Security
- RLS enabled on both new tables
- Only super_admins can write admin_roles and admin_invitations
- Analysts+ can read (to see who admins are)
- is_admin() updated to check admin_roles table, with old app_metadata fallback
- Existing user developperohit migrated to super_admin automatically
*/

-- ─── admin_roles table ───
CREATE TABLE IF NOT EXISTS public.admin_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('super_admin', 'admin', 'content_admin', 'analyst')),
  assigned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at timestamptz DEFAULT now(),
  suspended boolean DEFAULT false,
  last_admin_access timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_admin_roles_role ON public.admin_roles(role);
CREATE INDEX IF NOT EXISTS idx_admin_roles_suspended ON public.admin_roles(suspended);

-- ─── admin_invitations table ───
CREATE TABLE IF NOT EXISTS public.admin_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('super_admin', 'admin', 'content_admin', 'analyst')),
  token text NOT NULL UNIQUE,
  invited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  accepted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.admin_invitations ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_admin_inv_token ON public.admin_invitations(token);
CREATE INDEX IF NOT EXISTS idx_admin_inv_email ON public.admin_invitations(email);
CREATE INDEX IF NOT EXISTS idx_admin_inv_status ON public.admin_invitations(accepted_at);

-- ─── Role tier helper function (immutable, no table access) ───
CREATE OR REPLACE FUNCTION public.admin_role_tier(role text)
RETURNS int
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN role = 'super_admin' THEN 4
    WHEN role = 'admin' THEN 3
    WHEN role = 'content_admin' THEN 2
    WHEN role = 'analyst' THEN 1
    ELSE 0
  END;
$$;

-- ─── Get current user's admin role ───
CREATE OR REPLACE FUNCTION public.current_admin_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT ar.role
  FROM public.admin_roles ar
  WHERE ar.user_id = auth.uid()
    AND ar.suspended = false
  LIMIT 1;
$$;

-- ─── Check if current user has at least the given role tier ───
CREATE OR REPLACE FUNCTION public.has_admin_role(required_role text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT public.admin_role_tier(public.current_admin_role()) >= public.admin_role_tier(required_role);
$$;

-- ─── Count active super_admins ───
CREATE OR REPLACE FUNCTION public.active_super_admin_count()
RETURNS int
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT count(*)::int
  FROM public.admin_roles
  WHERE role = 'super_admin' AND suspended = false;
$$;

-- ─── Update is_admin() to check admin_roles table ───
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid() AND suspended = false),
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
$$;

-- ─── RLS Policies for admin_roles ───
-- Any admin (analyst+) can read the admin list
DROP POLICY IF EXISTS "admin_roles_select_admin" ON public.admin_roles;
CREATE POLICY "admin_roles_select_admin" ON public.admin_roles
  FOR SELECT TO authenticated
  USING (public.has_admin_role('analyst'));

-- Only super_admins can insert
DROP POLICY IF EXISTS "admin_roles_insert_super" ON public.admin_roles;
CREATE POLICY "admin_roles_insert_super" ON public.admin_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_admin_role('super_admin'));

-- Only super_admins can update
DROP POLICY IF EXISTS "admin_roles_update_super" ON public.admin_roles;
CREATE POLICY "admin_roles_update_super" ON public.admin_roles
  FOR UPDATE TO authenticated
  USING (public.has_admin_role('super_admin'))
  WITH CHECK (public.has_admin_role('super_admin'));

-- Only super_admins can delete
DROP POLICY IF EXISTS "admin_roles_delete_super" ON public.admin_roles;
CREATE POLICY "admin_roles_delete_super" ON public.admin_roles
  FOR DELETE TO authenticated
  USING (public.has_admin_role('super_admin'));

-- ─── RLS Policies for admin_invitations ───
DROP POLICY IF EXISTS "admin_inv_select_admin" ON public.admin_invitations;
CREATE POLICY "admin_inv_select_admin" ON public.admin_invitations
  FOR SELECT TO authenticated
  USING (public.has_admin_role('analyst'));

DROP POLICY IF EXISTS "admin_inv_insert_super" ON public.admin_invitations;
CREATE POLICY "admin_inv_insert_super" ON public.admin_invitations
  FOR INSERT TO authenticated
  WITH CHECK (public.has_admin_role('super_admin'));

DROP POLICY IF EXISTS "admin_inv_update_super" ON public.admin_invitations;
CREATE POLICY "admin_inv_update_super" ON public.admin_invitations
  FOR UPDATE TO authenticated
  USING (public.has_admin_role('super_admin'))
  WITH CHECK (public.has_admin_role('super_admin'));

DROP POLICY IF EXISTS "admin_inv_delete_super" ON public.admin_invitations;
CREATE POLICY "admin_inv_delete_super" ON public.admin_invitations
  FOR DELETE TO authenticated
  USING (public.has_admin_role('super_admin'));

-- ─── Migrate existing admin to super_admin ───
INSERT INTO public.admin_roles (user_id, role, assigned_by, assigned_at)
SELECT u.id, 'super_admin', u.id, now()
FROM auth.users u
WHERE (u.raw_app_meta_data ->> 'role') = 'admin'
  AND NOT EXISTS (SELECT 1 FROM public.admin_roles ar WHERE ar.user_id = u.id)
ON CONFLICT (user_id) DO NOTHING;
