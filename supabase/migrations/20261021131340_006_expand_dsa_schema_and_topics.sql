/*
# Expand DSA Problem Schema and Topics

## Purpose
Adds fields to dsa_problems for comprehensive LeetCode tracking and
creates all 43 DSA topics from the curriculum.

## Modified Tables
- dsa_problems: added columns
  - leetcode_number (int, nullable) — LeetCode problem number
  - leetcode_url (text, nullable) — official LeetCode problem URL (distinct from problem_url which can be any platform)
  - secondary_tags (text[]) — cross-topic classification
  - algorithm (text) — primary algorithm/data structure
  - prerequisite_concepts (text[]) — concepts needed before attempting
  - learning_order (int) — recommended order within a topic
  - problem_type (text) — 'foundational' | 'interview_essential' | 'advanced'
  - is_premium (boolean) — whether the problem is premium-only on LeetCode
  - company_tags (text[]) — approximate company frequency tags
  - attempt_count (int, default 0) — user's attempt count (on user_problem_progress)

- user_problem_progress: added columns
  - attempt_count (int, default 0)
  - completed_at (timestamptz, nullable — date the problem was solved)
  - bookmarked (boolean, default false — moved here for convenience, problem_bookmarks table stays)

## New Indexes
- idx_dsa_problems_leetcode_number for lookups by LeetCode number
- idx_dsa_problems_problem_type for filtering by type
- idx_dsa_problems_learning_order for ordering within topics
- Unique index on leetcode_number to prevent duplicates

## Topics Seeded
All 43 topics from the curriculum are inserted with proper display_order.
Existing topics are preserved (ON CONFLICT DO NOTHING).
*/

-- ─── Add columns to dsa_problems ───
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='dsa_problems' AND column_name='leetcode_number') THEN
    ALTER TABLE public.dsa_problems ADD COLUMN leetcode_number int;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='dsa_problems' AND column_name='leetcode_url') THEN
    ALTER TABLE public.dsa_problems ADD COLUMN leetcode_url text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='dsa_problems' AND column_name='secondary_tags') THEN
    ALTER TABLE public.dsa_problems ADD COLUMN secondary_tags text[] DEFAULT '{}';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='dsa_problems' AND column_name='algorithm') THEN
    ALTER TABLE public.dsa_problems ADD COLUMN algorithm text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='dsa_problems' AND column_name='prerequisite_concepts') THEN
    ALTER TABLE public.dsa_problems ADD COLUMN prerequisite_concepts text[] DEFAULT '{}';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='dsa_problems' AND column_name='learning_order') THEN
    ALTER TABLE public.dsa_problems ADD COLUMN learning_order int DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='dsa_problems' AND column_name='problem_type') THEN
    ALTER TABLE public.dsa_problems ADD COLUMN problem_type text DEFAULT 'foundational' CHECK (problem_type IN ('foundational', 'interview_essential', 'advanced'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='dsa_problems' AND column_name='is_premium') THEN
    ALTER TABLE public.dsa_problems ADD COLUMN is_premium boolean DEFAULT false;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='dsa_problems' AND column_name='company_tags') THEN
    ALTER TABLE public.dsa_problems ADD COLUMN company_tags text[] DEFAULT '{}';
  END IF;
END $$;

-- ─── Add columns to user_problem_progress ───
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_problem_progress' AND column_name='attempt_count') THEN
    ALTER TABLE public.user_problem_progress ADD COLUMN attempt_count int DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_problem_progress' AND column_name='completed_at') THEN
    ALTER TABLE public.user_problem_progress ADD COLUMN completed_at timestamptz;
  END IF;
END $$;

-- ─── Indexes ───
CREATE INDEX IF NOT EXISTS idx_dsa_problems_leetcode_number ON public.dsa_problems(leetcode_number);
CREATE INDEX IF NOT EXISTS idx_dsa_problems_problem_type ON public.dsa_problems(problem_type);
CREATE INDEX IF NOT EXISTS idx_dsa_problems_learning_order ON public.dsa_problems(topic_id, learning_order);

-- Unique index on leetcode_number (partial, so NULLs don't conflict)
DROP INDEX IF EXISTS idx_dsa_problems_leetcode_unique;
CREATE UNIQUE INDEX idx_dsa_problems_leetcode_unique ON public.dsa_problems(leetcode_number) WHERE leetcode_number IS NOT NULL;

-- ─── Seed all 43 DSA topics ───
INSERT INTO public.dsa_topics (name, slug, display_order) VALUES
  ('Programming Fundamentals', 'programming-fundamentals', 1),
  ('Time and Space Complexity', 'time-and-space-complexity', 2),
  ('Arrays', 'arrays', 3),
  ('Basic Mathematics', 'basic-mathematics', 4),
  ('Basic Recursion', 'basic-recursion', 5),
  ('Sorting', 'sorting', 6),
  ('Binary Search', 'binary-search', 7),
  ('Strings', 'strings', 8),
  ('Two Pointers', 'two-pointers', 9),
  ('Sliding Window', 'sliding-window', 10),
  ('Hashing', 'hashing', 11),
  ('Prefix Sums', 'prefix-sums', 12),
  ('Linked Lists', 'linked-lists', 13),
  ('Stacks', 'stacks', 14),
  ('Queues and Deques', 'queues-and-deques', 15),
  ('Bit Manipulation', 'bit-manipulation', 16),
  ('Recursion and Backtracking', 'recursion-and-backtracking', 17),
  ('Trees', 'trees', 18),
  ('Binary Search Trees', 'binary-search-trees', 19),
  ('Heaps and Priority Queues', 'heaps-and-priority-queues', 20),
  ('Greedy Algorithms', 'greedy-algorithms', 21),
  ('Intervals', 'intervals', 22),
  ('Tries', 'tries', 23),
  ('Graphs', 'graphs', 24),
  ('Breadth-First Search', 'breadth-first-search', 25),
  ('Depth-First Search', 'depth-first-search', 26),
  ('Topological Sorting', 'topological-sorting', 27),
  ('Disjoint Set Union', 'disjoint-set-union', 28),
  ('Shortest-Path Algorithms', 'shortest-path-algorithms', 29),
  ('Dynamic Programming', 'dynamic-programming', 30),
  ('One-Dimensional DP', 'one-dimensional-dp', 31),
  ('Two-Dimensional DP', 'two-dimensional-dp', 32),
  ('Knapsack and Subset DP', 'knapsack-and-subset-dp', 33),
  ('Bitmask DP', 'bitmask-dp', 34),
  ('Monotonic Stacks and Queues', 'monotonic-stacks-and-queues', 35),
  ('Advanced Binary Search', 'advanced-binary-search', 36),
  ('Segment Trees and Fenwick Trees', 'segment-trees-and-fenwick-trees', 37),
  ('Advanced Graph Algorithms', 'advanced-graph-algorithms', 38),
  ('String Matching Algorithms', 'string-matching-algorithms', 39),
  ('Number Theory and Combinatorics', 'number-theory-and-combinatorics', 40),
  ('Advanced Data Structures', 'advanced-data-structures', 41),
  ('Mixed Interview Practice', 'mixed-interview-practice', 42),
  ('Company-Tagged Interview Practice', 'company-tagged-interview-practice', 43)
ON CONFLICT (slug) DO NOTHING;
