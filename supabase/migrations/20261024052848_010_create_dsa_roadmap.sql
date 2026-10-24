/*
# Create DSA Learning Roadmap

## Purpose
Creates a "Data Structures & Algorithms" roadmap with 6 phases and lessons
that map to the existing DSA topic structure. This gives users a guided path
through DSA alongside the existing Web Development roadmap.

## New Content
- 1 roadmap: "Data Structures & Algorithms"
- 6 phases:
  1. Programming Fundamentals
  2. Core Data Structures
  3. Searching & Sorting
  4. Trees & Graphs
  5. Dynamic Programming
  6. Advanced Topics & Interview Prep
- 6 lessons (one per phase as a starting point, matching existing pattern)

## Notes
- No external URLs are invented — youtube_url, doc_url, practice_exercise
  are left null, matching the existing Web Dev roadmap pattern.
- Lessons reference the existing DSA topics by name in prerequisites.
- The roadmap is published (is_published = true).
*/

INSERT INTO public.roadmaps (id, name, slug, description, is_published)
SELECT '22222222-2222-2222-2222-222222222222', 'Data Structures & Algorithms', 'dsa-fundamentals', 'A structured path from programming basics to advanced algorithms and interview readiness.', true
WHERE NOT EXISTS (SELECT 1 FROM public.roadmaps WHERE slug = 'dsa-fundamentals');

-- Phase 1: Programming Fundamentals
INSERT INTO public.roadmap_phases (roadmap_id, title, description, display_order, is_published)
SELECT '22222222-2222-2222-2222-222222222222', 'Programming Fundamentals', 'Variables, loops, conditionals, functions, and basic I/O.', 1, true
WHERE NOT EXISTS (SELECT 1 FROM public.roadmap_phases WHERE roadmap_id = '22222222-2222-2222-2222-222222222222' AND display_order = 1);

-- Phase 2: Core Data Structures
INSERT INTO public.roadmap_phases (roadmap_id, title, description, display_order, is_published)
SELECT '22222222-2222-2222-2222-222222222222', 'Core Data Structures', 'Arrays, strings, linked lists, stacks, queues, and hashing.', 2, true
WHERE NOT EXISTS (SELECT 1 FROM public.roadmap_phases WHERE roadmap_id = '22222222-2222-2222-2222-222222222222' AND display_order = 2);

-- Phase 3: Searching & Sorting
INSERT INTO public.roadmap_phases (roadmap_id, title, description, display_order, is_published)
SELECT '22222222-2222-2222-2222-222222222222', 'Searching & Sorting', 'Binary search, two pointers, sliding window, and sorting algorithms.', 3, true
WHERE NOT EXISTS (SELECT 1 FROM public.roadmap_phases WHERE roadmap_id = '22222222-2222-2222-2222-222222222222' AND display_order = 3);

-- Phase 4: Trees & Graphs
INSERT INTO public.roadmap_phases (roadmap_id, title, description, display_order, is_published)
SELECT '22222222-2222-2222-2222-222222222222', 'Trees & Graphs', 'Binary trees, BSTs, heaps, graph traversal (BFS/DFS), and shortest paths.', 4, true
WHERE NOT EXISTS (SELECT 1 FROM public.roadmap_phases WHERE roadmap_id = '22222222-2222-2222-2222-222222222222' AND display_order = 4);

-- Phase 5: Dynamic Programming
INSERT INTO public.roadmap_phases (roadmap_id, title, description, display_order, is_published)
SELECT '22222222-2222-2222-2222-222222222222', 'Dynamic Programming', '1D and 2D DP, knapsack problems, and optimization techniques.', 5, true
WHERE NOT EXISTS (SELECT 1 FROM public.roadmap_phases WHERE roadmap_id = '22222222-2222-2222-2222-222222222222' AND display_order = 5);

-- Phase 6: Advanced Topics & Interview Prep
INSERT INTO public.roadmap_phases (roadmap_id, title, description, display_order, is_published)
SELECT '22222222-2222-2222-2222-222222222222', 'Advanced Topics & Interview Prep', 'Tries, segment trees, bit manipulation, greedy algorithms, and mixed interview practice.', 6, true
WHERE NOT EXISTS (SELECT 1 FROM public.roadmap_phases WHERE roadmap_id = '22222222-2222-2222-2222-222222222222' AND display_order = 6);

-- Lessons (one per phase, matching existing pattern)
INSERT INTO public.roadmap_lessons (phase_id, title, description, objectives, estimated_duration, difficulty, display_order, is_published)
SELECT p.id, 'Getting Started with Programming Fundamentals', 'Learn variables, data types, loops, conditionals, and functions — the building blocks of all algorithms.', ARRAY['Understand variables, data types, and operators','Master loops and conditionals','Write and call functions','Solve basic problems on arrays and math'], '2-3 hours', 'Beginner', 1, true
FROM public.roadmap_phases p WHERE p.roadmap_id = '22222222-2222-2222-2222-222222222222' AND p.display_order = 1
AND NOT EXISTS (SELECT 1 FROM public.roadmap_lessons rl JOIN public.roadmap_phases rp ON rl.phase_id = rp.id WHERE rp.roadmap_id = '22222222-2222-2222-2222-222222222222' AND rp.display_order = 1);

INSERT INTO public.roadmap_lessons (phase_id, title, description, objectives, estimated_duration, difficulty, display_order, is_published)
SELECT p.id, 'Arrays, Strings, and Hashing', 'Master the most frequently tested data structures: arrays, strings, hash maps, and hash sets.', ARRAY['Traverse and manipulate arrays','Use hash maps for O(1) lookups','Solve Two Sum and Contains Duplicate','Understand prefix sums'], '3-4 hours', 'Beginner', 1, true
FROM public.roadmap_phases p WHERE p.roadmap_id = '22222222-2222-2222-2222-222222222222' AND p.display_order = 2
AND NOT EXISTS (SELECT 1 FROM public.roadmap_lessons rl JOIN public.roadmap_phases rp ON rl.phase_id = rp.id WHERE rp.roadmap_id = '22222222-2222-2222-2222-222222222222' AND rp.display_order = 2);

INSERT INTO public.roadmap_lessons (phase_id, title, description, objectives, estimated_duration, difficulty, display_order, is_published)
SELECT p.id, 'Binary Search and Two Pointers', 'Learn to efficiently search sorted data and use two-pointer techniques for array problems.', ARRAY['Implement binary search','Apply two pointers on sorted arrays','Solve sliding window problems','Understand the search-insert pattern'], '3-4 hours', 'Intermediate', 1, true
FROM public.roadmap_phases p WHERE p.roadmap_id = '22222222-2222-2222-2222-222222222222' AND p.display_order = 3
AND NOT EXISTS (SELECT 1 FROM public.roadmap_lessons rl JOIN public.roadmap_phases rp ON rl.phase_id = rp.id WHERE rp.roadmap_id = '22222222-2222-2222-2222-222222222222' AND rp.display_order = 3);

INSERT INTO public.roadmap_lessons (phase_id, title, description, objectives, estimated_duration, difficulty, display_order, is_published)
SELECT p.id, 'Trees and Graph Traversal', 'Understand tree traversals, BSTs, heaps, and graph algorithms including BFS and DFS.', ARRAY['Traverse binary trees (inorder, preorder, postorder)','Validate and search BSTs','Implement BFS and DFS on graphs','Solve Number of Islands and Course Schedule'], '4-5 hours', 'Intermediate', 1, true
FROM public.roadmap_phases p WHERE p.roadmap_id = '22222222-2222-2222-2222-222222222222' AND p.display_order = 4
AND NOT EXISTS (SELECT 1 FROM public.roadmap_lessons rl JOIN public.roadmap_phases rp ON rl.phase_id = rp.id WHERE rp.roadmap_id = '22222222-2222-2222-2222-222222222222' AND rp.display_order = 4);

INSERT INTO public.roadmap_lessons (phase_id, title, description, objectives, estimated_duration, difficulty, display_order, is_published)
SELECT p.id, 'Dynamic Programming Fundamentals', 'Learn to identify DP patterns, write recurrence relations, and solve classic DP problems.', ARRAY['Understand overlapping subproblems and optimal substructure','Solve Climbing Stairs and House Robber','Master 2D DP with Longest Common Subsequence','Apply knapsack patterns'], '4-5 hours', 'Advanced', 1, true
FROM public.roadmap_phases p WHERE p.roadmap_id = '22222222-2222-2222-2222-222222222222' AND p.display_order = 5
AND NOT EXISTS (SELECT 1 FROM public.roadmap_lessons rl JOIN public.roadmap_phases rp ON rl.phase_id = rp.id WHERE rp.roadmap_id = '22222222-2222-2222-2222-222222222222' AND rp.display_order = 5);

INSERT INTO public.roadmap_lessons (phase_id, title, description, objectives, estimated_duration, difficulty, display_order, is_published)
SELECT p.id, 'Advanced Structures and Interview Practice', 'Cover tries, segment trees, bit manipulation, greedy algorithms, and mixed interview problems.', ARRAY['Implement a Trie for prefix problems','Understand segment trees for range queries','Apply bit manipulation tricks','Solve mixed interview problems under time pressure'], '4-5 hours', 'Advanced', 1, true
FROM public.roadmap_phases p WHERE p.roadmap_id = '22222222-2222-2222-2222-222222222222' AND p.display_order = 6
AND NOT EXISTS (SELECT 1 FROM public.roadmap_lessons rl JOIN public.roadmap_phases rp ON rl.phase_id = rp.id WHERE rp.roadmap_id = '22222222-2222-2222-2222-222222222222' AND rp.display_order = 6);
