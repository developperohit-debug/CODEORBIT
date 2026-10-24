/*
# CodeOrbit Initial Schema (re-applied in correct order)

Creates the complete database foundation. This version reorders conversations
and conversation_participants so policies that reference the participant table
are added after it exists. All other content identical to first attempt.
*/

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

-- profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  avatar_url text,
  bio text,
  college text,
  degree text,
  branch text,
  graduation_year int,
  current_semester text,
  gender text,
  country text,
  github_url text,
  linkedin_url text,
  leetcode_username text,
  primary_language text,
  dsa_experience text,
  web_dev_experience text,
  career_goal text,
  daily_learning_time text,
  skills text[] DEFAULT '{}',
  learning_interests text[] DEFAULT '{}',
  is_public boolean DEFAULT true,
  suspended boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_profiles_college ON public.profiles(college);
CREATE INDEX IF NOT EXISTS idx_profiles_graduation_year ON public.profiles(graduation_year);
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- user_preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id uuid PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_difficulty text DEFAULT 'Easy',
  weekly_goal int DEFAULT 5,
  notifications_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "prefs_select_own" ON public.user_preferences;
CREATE POLICY "prefs_select_own" ON public.user_preferences FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "prefs_insert_own" ON public.user_preferences;
CREATE POLICY "prefs_insert_own" ON public.user_preferences FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "prefs_update_own" ON public.user_preferences;
CREATE POLICY "prefs_update_own" ON public.user_preferences FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "prefs_delete_own" ON public.user_preferences;
CREATE POLICY "prefs_delete_own" ON public.user_preferences FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- dsa_topics
CREATE TABLE IF NOT EXISTS public.dsa_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.dsa_topics ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_dsa_topics_slug ON public.dsa_topics(slug);
DROP POLICY IF EXISTS "dsa_topics_select" ON public.dsa_topics;
CREATE POLICY "dsa_topics_select" ON public.dsa_topics FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "dsa_topics_admin_insert" ON public.dsa_topics;
CREATE POLICY "dsa_topics_admin_insert" ON public.dsa_topics FOR INSERT TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "dsa_topics_admin_update" ON public.dsa_topics;
CREATE POLICY "dsa_topics_admin_update" ON public.dsa_topics FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "dsa_topics_admin_delete" ON public.dsa_topics;
CREATE POLICY "dsa_topics_admin_delete" ON public.dsa_topics FOR DELETE TO authenticated USING (public.is_admin());

-- dsa_problems
CREATE TABLE IF NOT EXISTS public.dsa_problems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  problem_url text NOT NULL,
  difficulty text NOT NULL CHECK (difficulty IN ('Easy','Medium','Hard')),
  topic_id uuid REFERENCES public.dsa_topics(id) ON DELETE SET NULL,
  subtopic text,
  prerequisites text[] DEFAULT '{}',
  hints text[] DEFAULT '{}',
  editorial_url text,
  youtube_url text,
  code_solution text,
  tags text[] DEFAULT '{}',
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.dsa_problems ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_dsa_problems_topic ON public.dsa_problems(topic_id);
CREATE INDEX IF NOT EXISTS idx_dsa_problems_difficulty ON public.dsa_problems(difficulty);
CREATE INDEX IF NOT EXISTS idx_dsa_problems_published ON public.dsa_problems(is_published);
DROP POLICY IF EXISTS "dsa_problems_select" ON public.dsa_problems;
CREATE POLICY "dsa_problems_select" ON public.dsa_problems FOR SELECT TO authenticated USING (is_published OR public.is_admin());
DROP POLICY IF EXISTS "dsa_problems_admin_insert" ON public.dsa_problems;
CREATE POLICY "dsa_problems_admin_insert" ON public.dsa_problems FOR INSERT TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "dsa_problems_admin_update" ON public.dsa_problems;
CREATE POLICY "dsa_problems_admin_update" ON public.dsa_problems FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "dsa_problems_admin_delete" ON public.dsa_problems;
CREATE POLICY "dsa_problems_admin_delete" ON public.dsa_problems FOR DELETE TO authenticated USING (public.is_admin());

-- user_problem_progress
CREATE TABLE IF NOT EXISTS public.user_problem_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  problem_id uuid NOT NULL REFERENCES public.dsa_problems(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'Not Started' CHECK (status IN ('Not Started','Attempted','Solved with Hints','Solved Independently','Needs Revision')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, problem_id)
);
ALTER TABLE public.user_problem_progress ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_upp_user ON public.user_problem_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_upp_problem ON public.user_problem_progress(problem_id);
DROP POLICY IF EXISTS "upp_select_own" ON public.user_problem_progress;
CREATE POLICY "upp_select_own" ON public.user_problem_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "upp_insert_own" ON public.user_problem_progress;
CREATE POLICY "upp_insert_own" ON public.user_problem_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "upp_update_own" ON public.user_problem_progress;
CREATE POLICY "upp_update_own" ON public.user_problem_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "upp_delete_own" ON public.user_problem_progress;
CREATE POLICY "upp_delete_own" ON public.user_problem_progress FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- problem_bookmarks
CREATE TABLE IF NOT EXISTS public.problem_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  problem_id uuid NOT NULL REFERENCES public.dsa_problems(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, problem_id)
);
ALTER TABLE public.problem_bookmarks ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_pb_user ON public.problem_bookmarks(user_id);
DROP POLICY IF EXISTS "pb_select_own" ON public.problem_bookmarks;
CREATE POLICY "pb_select_own" ON public.problem_bookmarks FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "pb_insert_own" ON public.problem_bookmarks;
CREATE POLICY "pb_insert_own" ON public.problem_bookmarks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "pb_delete_own" ON public.problem_bookmarks;
CREATE POLICY "pb_delete_own" ON public.problem_bookmarks FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- roadmaps
CREATE TABLE IF NOT EXISTS public.roadmaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "roadmaps_select" ON public.roadmaps;
CREATE POLICY "roadmaps_select" ON public.roadmaps FOR SELECT TO authenticated USING (is_published OR public.is_admin());
DROP POLICY IF EXISTS "roadmaps_admin_insert" ON public.roadmaps;
CREATE POLICY "roadmaps_admin_insert" ON public.roadmaps FOR INSERT TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "roadmaps_admin_update" ON public.roadmaps;
CREATE POLICY "roadmaps_admin_update" ON public.roadmaps FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "roadmaps_admin_delete" ON public.roadmaps;
CREATE POLICY "roadmaps_admin_delete" ON public.roadmaps FOR DELETE TO authenticated USING (public.is_admin());

-- roadmap_phases
CREATE TABLE IF NOT EXISTS public.roadmap_phases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id uuid NOT NULL REFERENCES public.roadmaps(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  display_order int DEFAULT 0,
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.roadmap_phases ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_rp_roadmap ON public.roadmap_phases(roadmap_id);
DROP POLICY IF EXISTS "rp_select" ON public.roadmap_phases;
CREATE POLICY "rp_select" ON public.roadmap_phases FOR SELECT TO authenticated USING (is_published OR public.is_admin());
DROP POLICY IF EXISTS "rp_admin_insert" ON public.roadmap_phases;
CREATE POLICY "rp_admin_insert" ON public.roadmap_phases FOR INSERT TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "rp_admin_update" ON public.roadmap_phases;
CREATE POLICY "rp_admin_update" ON public.roadmap_phases FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "rp_admin_delete" ON public.roadmap_phases;
CREATE POLICY "rp_admin_delete" ON public.roadmap_phases FOR DELETE TO authenticated USING (public.is_admin());

-- roadmap_lessons
CREATE TABLE IF NOT EXISTS public.roadmap_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id uuid NOT NULL REFERENCES public.roadmap_phases(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  objectives text[] DEFAULT '{}',
  youtube_url text,
  doc_url text,
  practice_exercise text,
  mini_project text,
  estimated_duration text,
  prerequisites text,
  difficulty text DEFAULT 'Beginner',
  is_published boolean DEFAULT false,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.roadmap_lessons ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_rl_phase ON public.roadmap_lessons(phase_id);
DROP POLICY IF EXISTS "rl_select" ON public.roadmap_lessons;
CREATE POLICY "rl_select" ON public.roadmap_lessons FOR SELECT TO authenticated USING (is_published OR public.is_admin());
DROP POLICY IF EXISTS "rl_admin_insert" ON public.roadmap_lessons;
CREATE POLICY "rl_admin_insert" ON public.roadmap_lessons FOR INSERT TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "rl_admin_update" ON public.roadmap_lessons;
CREATE POLICY "rl_admin_update" ON public.roadmap_lessons FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "rl_admin_delete" ON public.roadmap_lessons;
CREATE POLICY "rl_admin_delete" ON public.roadmap_lessons FOR DELETE TO authenticated USING (public.is_admin());

-- user_lesson_progress
CREATE TABLE IF NOT EXISTS public.user_lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.roadmap_lessons(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'Not Started' CHECK (status IN ('Not Started','Learning','Practicing','Completed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);
ALTER TABLE public.user_lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_ulp_user ON public.user_lesson_progress(user_id);
DROP POLICY IF EXISTS "ulp_select_own" ON public.user_lesson_progress;
CREATE POLICY "ulp_select_own" ON public.user_lesson_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "ulp_insert_own" ON public.user_lesson_progress;
CREATE POLICY "ulp_insert_own" ON public.user_lesson_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "ulp_update_own" ON public.user_lesson_progress;
CREATE POLICY "ulp_update_own" ON public.user_lesson_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "ulp_delete_own" ON public.user_lesson_progress;
CREATE POLICY "ulp_delete_own" ON public.user_lesson_progress FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- learning_notes
CREATE TABLE IF NOT EXISTS public.learning_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid REFERENCES public.roadmap_lessons(id) ON DELETE CASCADE,
  problem_id uuid REFERENCES public.dsa_problems(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.learning_notes ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_ln_user ON public.learning_notes(user_id);
DROP POLICY IF EXISTS "ln_select_own" ON public.learning_notes;
CREATE POLICY "ln_select_own" ON public.learning_notes FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "ln_insert_own" ON public.learning_notes;
CREATE POLICY "ln_insert_own" ON public.learning_notes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "ln_update_own" ON public.learning_notes;
CREATE POLICY "ln_update_own" ON public.learning_notes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "ln_delete_own" ON public.learning_notes;
CREATE POLICY "ln_delete_own" ON public.learning_notes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- events
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  organizer text,
  description text,
  category text NOT NULL CHECK (category IN ('Coding Contest','Hackathon')),
  start_date timestamptz NOT NULL,
  end_date timestamptz,
  registration_deadline timestamptz,
  timezone text,
  format text CHECK (format IN ('Online','Offline','Hybrid')),
  eligibility text,
  prize_details text,
  registration_url text,
  event_url text,
  status text DEFAULT 'Upcoming' CHECK (status IN ('Upcoming','Ongoing','Completed','Cancelled')),
  banner_url text,
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(category);
CREATE INDEX IF NOT EXISTS idx_events_start ON public.events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_published ON public.events(is_published);
DROP POLICY IF EXISTS "events_select" ON public.events;
CREATE POLICY "events_select" ON public.events FOR SELECT TO authenticated USING (is_published OR public.is_admin());
DROP POLICY IF EXISTS "events_admin_insert" ON public.events;
CREATE POLICY "events_admin_insert" ON public.events FOR INSERT TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "events_admin_update" ON public.events;
CREATE POLICY "events_admin_update" ON public.events FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "events_admin_delete" ON public.events;
CREATE POLICY "events_admin_delete" ON public.events FOR DELETE TO authenticated USING (public.is_admin());

-- event_bookmarks
CREATE TABLE IF NOT EXISTS public.event_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, event_id)
);
ALTER TABLE public.event_bookmarks ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_eb_user ON public.event_bookmarks(user_id);
DROP POLICY IF EXISTS "eb_select_own" ON public.event_bookmarks;
CREATE POLICY "eb_select_own" ON public.event_bookmarks FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "eb_insert_own" ON public.event_bookmarks;
CREATE POLICY "eb_insert_own" ON public.event_bookmarks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "eb_delete_own" ON public.event_bookmarks;
CREATE POLICY "eb_delete_own" ON public.event_bookmarks FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- discussions
CREATE TABLE IF NOT EXISTS public.discussions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL,
  tags text[] DEFAULT '{}',
  upvotes int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.discussions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_disc_category ON public.discussions(category);
CREATE INDEX IF NOT EXISTS idx_disc_author ON public.discussions(author_id);
DROP POLICY IF EXISTS "disc_select_all" ON public.discussions;
CREATE POLICY "disc_select_all" ON public.discussions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "disc_insert_own" ON public.discussions;
CREATE POLICY "disc_insert_own" ON public.discussions FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
DROP POLICY IF EXISTS "disc_update_own" ON public.discussions;
CREATE POLICY "disc_update_own" ON public.discussions FOR UPDATE TO authenticated USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);
DROP POLICY IF EXISTS "disc_delete_own" ON public.discussions;
CREATE POLICY "disc_delete_own" ON public.discussions FOR DELETE TO authenticated USING (auth.uid() = author_id);
DROP POLICY IF EXISTS "disc_admin_delete" ON public.discussions;
CREATE POLICY "disc_admin_delete" ON public.discussions FOR DELETE TO authenticated USING (public.is_admin());

-- discussion_comments
CREATE TABLE IF NOT EXISTS public.discussion_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id uuid NOT NULL REFERENCES public.discussions(id) ON DELETE CASCADE,
  author_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.discussion_comments(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.discussion_comments ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_dc_disc ON public.discussion_comments(discussion_id);
CREATE INDEX IF NOT EXISTS idx_dc_parent ON public.discussion_comments(parent_id);
DROP POLICY IF EXISTS "dc_select_all" ON public.discussion_comments;
CREATE POLICY "dc_select_all" ON public.discussion_comments FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "dc_insert_own" ON public.discussion_comments;
CREATE POLICY "dc_insert_own" ON public.discussion_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
DROP POLICY IF EXISTS "dc_update_own" ON public.discussion_comments;
CREATE POLICY "dc_update_own" ON public.discussion_comments FOR UPDATE TO authenticated USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);
DROP POLICY IF EXISTS "dc_delete_own" ON public.discussion_comments;
CREATE POLICY "dc_delete_own" ON public.discussion_comments FOR DELETE TO authenticated USING (auth.uid() = author_id);
DROP POLICY IF EXISTS "dc_admin_delete" ON public.discussion_comments;
CREATE POLICY "dc_admin_delete" ON public.discussion_comments FOR DELETE TO authenticated USING (public.is_admin());

-- discussion_votes
CREATE TABLE IF NOT EXISTS public.discussion_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  discussion_id uuid NOT NULL REFERENCES public.discussions(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, discussion_id)
);
ALTER TABLE public.discussion_votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dv_select_own" ON public.discussion_votes;
CREATE POLICY "dv_select_own" ON public.discussion_votes FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "dv_insert_own" ON public.discussion_votes;
CREATE POLICY "dv_insert_own" ON public.discussion_votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "dv_delete_own" ON public.discussion_votes;
CREATE POLICY "dv_delete_own" ON public.discussion_votes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- discussion_bookmarks
CREATE TABLE IF NOT EXISTS public.discussion_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  discussion_id uuid NOT NULL REFERENCES public.discussions(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, discussion_id)
);
ALTER TABLE public.discussion_bookmarks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "db_select_own" ON public.discussion_bookmarks;
CREATE POLICY "db_select_own" ON public.discussion_bookmarks FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "db_insert_own" ON public.discussion_bookmarks;
CREATE POLICY "db_insert_own" ON public.discussion_bookmarks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "db_delete_own" ON public.discussion_bookmarks;
CREATE POLICY "db_delete_own" ON public.discussion_bookmarks FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- communities
CREATE TABLE IF NOT EXISTS public.communities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  college text,
  topic text,
  membership_rule text DEFAULT 'Open',
  announcement text,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_comm_college ON public.communities(college);
DROP POLICY IF EXISTS "comm_select_all" ON public.communities;
CREATE POLICY "comm_select_all" ON public.communities FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "comm_insert_own" ON public.communities;
CREATE POLICY "comm_insert_own" ON public.communities FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
DROP POLICY IF EXISTS "comm_update_creator" ON public.communities;
CREATE POLICY "comm_update_creator" ON public.communities FOR UPDATE TO authenticated USING (auth.uid() = created_by OR public.is_admin()) WITH CHECK (auth.uid() = created_by OR public.is_admin());
DROP POLICY IF EXISTS "comm_delete_creator" ON public.communities;
CREATE POLICY "comm_delete_creator" ON public.communities FOR DELETE TO authenticated USING (auth.uid() = created_by OR public.is_admin());

-- community_memberships
CREATE TABLE IF NOT EXISTS public.community_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'Member' CHECK (role IN ('Owner','Admin','Member')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(community_id, user_id)
);
ALTER TABLE public.community_memberships ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_cm_community ON public.community_memberships(community_id);
CREATE INDEX IF NOT EXISTS idx_cm_user ON public.community_memberships(user_id);
DROP POLICY IF EXISTS "cm_select_all" ON public.community_memberships;
CREATE POLICY "cm_select_all" ON public.community_memberships FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "cm_insert_own" ON public.community_memberships;
CREATE POLICY "cm_insert_own" ON public.community_memberships FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "cm_delete_own" ON public.community_memberships;
CREATE POLICY "cm_delete_own" ON public.community_memberships FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.is_admin());

-- conversations + conversation_participants (created before policies that reference them)
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_cpart_user ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_cpart_conv ON public.conversation_participants(conversation_id);

DROP POLICY IF EXISTS "conv_select_participant" ON public.conversations;
CREATE POLICY "conv_select_participant" ON public.conversations FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.conversation_participants cp WHERE cp.conversation_id = conversations.id AND cp.user_id = auth.uid()));
DROP POLICY IF EXISTS "conv_insert_auth" ON public.conversations;
CREATE POLICY "conv_insert_auth" ON public.conversations FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "cpart_select_own" ON public.conversation_participants;
CREATE POLICY "cpart_select_own" ON public.conversation_participants FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.conversation_participants cp2 WHERE cp2.conversation_id = conversation_participants.conversation_id AND cp2.user_id = auth.uid()));
DROP POLICY IF EXISTS "cpart_insert_own" ON public.conversation_participants;
CREATE POLICY "cpart_insert_own" ON public.conversation_participants FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "cpart_delete_own" ON public.conversation_participants;
CREATE POLICY "cpart_delete_own" ON public.conversation_participants FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- messages
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_msg_conv ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_msg_sender ON public.messages(sender_id);
DROP POLICY IF EXISTS "msg_select_participant" ON public.messages;
CREATE POLICY "msg_select_participant" ON public.messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.conversation_participants cp WHERE cp.conversation_id = messages.conversation_id AND cp.user_id = auth.uid()));
DROP POLICY IF EXISTS "msg_insert_participant" ON public.messages;
CREATE POLICY "msg_insert_participant" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id AND EXISTS (SELECT 1 FROM public.conversation_participants cp WHERE cp.conversation_id = messages.conversation_id AND cp.user_id = auth.uid()));
DROP POLICY IF EXISTS "msg_delete_own" ON public.messages;
CREATE POLICY "msg_delete_own" ON public.messages FOR DELETE TO authenticated USING (auth.uid() = sender_id);

-- content_reports
CREATE TABLE IF NOT EXISTS public.content_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  reason text NOT NULL,
  status text DEFAULT 'Pending' CHECK (status IN ('Pending','Resolved','Dismissed')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_cr_status ON public.content_reports(status);
DROP POLICY IF EXISTS "cr_insert_own" ON public.content_reports;
CREATE POLICY "cr_insert_own" ON public.content_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
DROP POLICY IF EXISTS "cr_select_own_admin" ON public.content_reports;
CREATE POLICY "cr_select_own_admin" ON public.content_reports FOR SELECT TO authenticated USING (auth.uid() = reporter_id OR public.is_admin());
DROP POLICY IF EXISTS "cr_admin_update" ON public.content_reports;
CREATE POLICY "cr_admin_update" ON public.content_reports FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- announcements
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  status text DEFAULT 'Draft' CHECK (status IN ('Draft','Published','Archived')),
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_ann_status ON public.announcements(status);
DROP POLICY IF EXISTS "ann_select" ON public.announcements;
CREATE POLICY "ann_select" ON public.announcements FOR SELECT TO authenticated USING (status = 'Published' OR public.is_admin());
DROP POLICY IF EXISTS "ann_admin_insert" ON public.announcements;
CREATE POLICY "ann_admin_insert" ON public.announcements FOR INSERT TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "ann_admin_update" ON public.announcements;
CREATE POLICY "ann_admin_update" ON public.announcements FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "ann_admin_delete" ON public.announcements;
CREATE POLICY "ann_admin_delete" ON public.announcements FOR DELETE TO authenticated USING (public.is_admin());

-- audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_type text,
  target_id uuid,
  details text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_audit_admin ON public.audit_logs(admin_id);
DROP POLICY IF EXISTS "audit_admin_all" ON public.audit_logs;
CREATE POLICY "audit_admin_all" ON public.audit_logs FOR SELECT TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "audit_admin_insert" ON public.audit_logs;
CREATE POLICY "audit_admin_insert" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (public.is_admin());

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_updated ON public.profiles;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS trg_dsa_problems_updated ON public.dsa_problems;
CREATE TRIGGER trg_dsa_problems_updated BEFORE UPDATE ON public.dsa_problems FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS trg_roadmaps_updated ON public.roadmaps;
CREATE TRIGGER trg_roadmaps_updated BEFORE UPDATE ON public.roadmaps FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS trg_roadmap_lessons_updated ON public.roadmap_lessons;
CREATE TRIGGER trg_roadmap_lessons_updated BEFORE UPDATE ON public.roadmap_lessons FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS trg_events_updated ON public.events;
CREATE TRIGGER trg_events_updated BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS trg_discussions_updated ON public.discussions;
CREATE TRIGGER trg_discussions_updated BEFORE UPDATE ON public.discussions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS trg_communities_updated ON public.communities;
CREATE TRIGGER trg_communities_updated BEFORE UPDATE ON public.communities FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
