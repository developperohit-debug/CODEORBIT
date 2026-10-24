/*
# Seed Content (demonstration data)
Adds DSA topic taxonomy, a published Web Development roadmap with 12 phases + starter lessons,
sample published DSA problems, and sample upcoming events.
*/

INSERT INTO public.dsa_topics (name, slug, display_order) VALUES
  ('Programming Fundamentals','programming-fundamentals',1),
  ('Arrays','arrays',2),
  ('Strings','strings',3),
  ('Hashing','hashing',4),
  ('Sorting','sorting',5),
  ('Binary Search','binary-search',6),
  ('Two Pointers','two-pointers',7),
  ('Sliding Window','sliding-window',8),
  ('Linked Lists','linked-lists',9),
  ('Stacks','stacks',10),
  ('Queues','queues',11),
  ('Recursion','recursion',12),
  ('Backtracking','backtracking',13),
  ('Trees','trees',14),
  ('Binary Search Trees','binary-search-trees',15),
  ('Heaps','heaps',16),
  ('Greedy Algorithms','greedy-algorithms',17),
  ('Graphs','graphs',18),
  ('Dynamic Programming','dynamic-programming',19),
  ('Tries','tries',20),
  ('Bit Manipulation','bit-manipulation',21),
  ('Advanced Data Structures','advanced-data-structures',22)
ON CONFLICT (slug) DO NOTHING;

-- Roadmap (use a fixed valid UUID)
INSERT INTO public.roadmaps (id, name, slug, description, is_published) VALUES
  ('11111111-1111-1111-1111-111111111111','Web Development','web-development','A structured path from HTML to real-world full-stack projects.',true)
ON CONFLICT (slug) DO NOTHING;

-- Phases inserted one at a time so display_order maps predictably; use a sequence via a data CTE.
WITH phase_data(title, description, display_order) AS (VALUES
  ('HTML','Structure and semantics of the web.',1),
  ('CSS','Styling, layout, and responsive design.',2),
  ('JavaScript','The language of the web.',3),
  ('Git and GitHub','Version control and collaboration.',4),
  ('Responsive Design','Mobile-first layouts and media queries.',5),
  ('Frontend Frameworks','React and component-driven UI.',6),
  ('API Integration','Fetching and managing data.',7),
  ('Backend Fundamentals','Node, Express, and server basics.',8),
  ('Databases','Relational and NoSQL data storage.',9),
  ('Authentication','Secure sign-in and sessions.',10),
  ('Deployment','Shipping to production.',11),
  ('Real-world Projects','Putting it all together.',12)
)
INSERT INTO public.roadmap_phases (roadmap_id, title, description, display_order, is_published)
SELECT '11111111-1111-1111-1111-111111111111', title, description, display_order, true
FROM phase_data pd
WHERE NOT EXISTS (SELECT 1 FROM public.roadmap_phases rp WHERE rp.roadmap_id='11111111-1111-1111-1111-111111111111' AND rp.title=pd.title);

-- One starter lesson per phase
INSERT INTO public.roadmap_lessons (phase_id, title, description, objectives, estimated_duration, difficulty, is_published, display_order)
SELECT ph.id, 'Getting Started with ' || ph.title, 'Introductory lesson for ' || ph.title, ARRAY['Understand core concepts','Build a small example'], '1-2 hours', 'Beginner', true, 1
FROM public.roadmap_phases ph
WHERE NOT EXISTS (SELECT 1 FROM public.roadmap_lessons rl WHERE rl.phase_id = ph.id);

-- Sample problems
INSERT INTO public.dsa_problems (title, description, problem_url, difficulty, topic_id, subtopic, is_published, tags)
SELECT 'Two Sum', 'Find two numbers that add up to a target.', 'https://leetcode.com/problems/two-sum/', 'Easy', t.id, 'Basics', true, ARRAY['array','hashing']
FROM public.dsa_topics t WHERE t.slug='arrays'
AND NOT EXISTS (SELECT 1 FROM public.dsa_problems p WHERE p.title='Two Sum');

INSERT INTO public.dsa_problems (title, description, problem_url, difficulty, topic_id, subtopic, is_published, tags)
SELECT 'Reverse Linked List', 'Reverse a singly linked list.', 'https://leetcode.com/problems/reverse-linked-list/', 'Easy', t.id, 'Basics', true, ARRAY['linked-list']
FROM public.dsa_topics t WHERE t.slug='linked-lists'
AND NOT EXISTS (SELECT 1 FROM public.dsa_problems p WHERE p.title='Reverse Linked List');

INSERT INTO public.dsa_problems (title, description, problem_url, difficulty, topic_id, subtopic, is_published, tags)
SELECT 'Binary Tree Level Order Traversal', 'Traverse a tree level by level.', 'https://leetcode.com/problems/binary-tree-level-order-traversal/', 'Medium', t.id, 'Traversal', true, ARRAY['tree','bfs']
FROM public.dsa_topics t WHERE t.slug='trees'
AND NOT EXISTS (SELECT 1 FROM public.dsa_problems p WHERE p.title='Binary Tree Level Order Traversal');

INSERT INTO public.dsa_problems (title, description, problem_url, difficulty, topic_id, subtopic, is_published, tags)
SELECT 'Longest Palindromic Substring', 'Find the longest palindromic substring.', 'https://leetcode.com/problems/longest-palindromic-substring/', 'Medium', t.id, 'DP', true, ARRAY['string','dp']
FROM public.dsa_topics t WHERE t.slug='strings'
AND NOT EXISTS (SELECT 1 FROM public.dsa_problems p WHERE p.title='Longest Palindromic Substring');

INSERT INTO public.dsa_problems (title, description, problem_url, difficulty, topic_id, subtopic, is_published, tags)
SELECT 'Median of Two Sorted Arrays', 'Find the median of two sorted arrays in logarithmic time.', 'https://leetcode.com/problems/median-of-two-sorted-arrays/', 'Hard', t.id, 'Advanced', true, ARRAY['binary-search','array']
FROM public.dsa_topics t WHERE t.slug='binary-search'
AND NOT EXISTS (SELECT 1 FROM public.dsa_problems p WHERE p.title='Median of Two Sorted Arrays');

INSERT INTO public.dsa_problems (title, description, problem_url, difficulty, topic_id, subtopic, is_published, tags)
SELECT 'Course Schedule', 'Detect if a set of courses can be finished given prerequisites.', 'https://leetcode.com/problems/course-schedule/', 'Medium', t.id, 'Topological Sort', true, ARRAY['graph','bfs']
FROM public.dsa_topics t WHERE t.slug='graphs'
AND NOT EXISTS (SELECT 1 FROM public.dsa_problems p WHERE p.title='Course Schedule');

-- Sample events
INSERT INTO public.events (title, organizer, description, category, start_date, end_date, registration_deadline, timezone, format, eligibility, registration_url, event_url, status, is_published)
SELECT 'Weekly Code Sprint', 'CodeOrbit', 'A fast-paced weekly coding contest with 4 problems of increasing difficulty.', 'Coding Contest', now() + interval '5 days', now() + interval '5 days 2 hours', now() + interval '4 days 20 hours', 'IST', 'Online', 'Open to all registered users', 'https://example.com/register', 'https://example.com/event', 'Upcoming', true
WHERE NOT EXISTS (SELECT 1 FROM public.events e WHERE e.title='Weekly Code Sprint');

INSERT INTO public.events (title, organizer, description, category, start_date, end_date, registration_deadline, timezone, format, eligibility, prize_details, registration_url, event_url, status, is_published)
SELECT 'BuildForTomorrow Hackathon', 'TechFest', '48-hour hackathon to build solutions for sustainable cities.', 'Hackathon', now() + interval '14 days', now() + interval '16 days', now() + interval '13 days', 'IST', 'Hybrid', 'College students', 'Cash prizes and internships', 'https://example.com/hackathon-register', 'https://example.com/hackathon', 'Upcoming', true
WHERE NOT EXISTS (SELECT 1 FROM public.events e WHERE e.title='BuildForTomorrow Hackathon');
