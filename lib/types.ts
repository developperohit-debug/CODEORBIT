export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export type ProblemStatus =
  | 'Not Started'
  | 'Attempted'
  | 'Solved with Hints'
  | 'Solved Independently'
  | 'Needs Revision';

export type LessonStatus = 'Not Started' | 'Learning' | 'Practicing' | 'Completed';

export type EventCategory = 'Coding Contest' | 'Hackathon';
export type EventStatus = 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled';

export type DiscussionCategory =
  | 'DSA'
  | 'Competitive Programming'
  | 'Web Development'
  | 'Projects'
  | 'Internships'
  | 'Hackathons'
  | 'General Discussion';

export interface Profile {
  id: string;
  full_name: string;
  username: string | null;
  phone: string | null;
  contact_email: string | null;
  avatar_url: string | null;
  bio: string | null;
  college: string | null;
  degree: string | null;
  branch: string | null;
  graduation_year: number | null;
  current_semester: string | null;
  gender: string | null;
  country: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  leetcode_username: string | null;
  primary_language: string | null;
  dsa_experience: string | null;
  web_dev_experience: string | null;
  career_goal: string | null;
  daily_learning_time: string | null;
  skills: string[];
  learning_interests: string[];
  is_public: boolean;
  suspended: boolean;
  created_at: string;
  updated_at: string;
}

export interface DsaTopic {
  id: string;
  name: string;
  slug: string;
  display_order: number;
  created_at: string;
}

export type ProblemType = 'foundational' | 'interview_essential' | 'advanced';

export interface DsaProblem {
  id: string;
  title: string;
  description: string | null;
  problem_url: string;
  difficulty: Difficulty;
  topic_id: string | null;
  subtopic: string | null;
  prerequisites: string[];
  hints: string[];
  editorial_url: string | null;
  youtube_url: string | null;
  code_solution: string | null;
  tags: string[];
  is_published: boolean;
  created_at: string;
  updated_at: string;
  topic?: DsaTopic | null;
  // Fields added in migration 006
  leetcode_number?: number | null;
  leetcode_url?: string | null;
  secondary_tags?: string[];
  algorithm?: string | null;
  prerequisite_concepts?: string[];
  learning_order?: number;
  problem_type?: ProblemType;
  is_premium?: boolean;
  company_tags?: string[];
}

export type AdminRole = 'super_admin' | 'admin' | 'content_admin' | 'analyst';

export interface AdminRoleRecord {
  user_id: string;
  role: AdminRole;
  assigned_by: string | null;
  assigned_at: string;
  suspended: boolean;
  last_admin_access: string | null;
  created_at: string;
}

export interface UserProblemProgress {
  id: string;
  user_id: string;
  problem_id: string;
  status: ProblemStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Fields added in migration 006
  attempt_count?: number;
  completed_at?: string | null;
}

export interface ProblemBookmark {
  id: string;
  user_id: string;
  problem_id: string;
  created_at: string;
}

export interface Roadmap {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoadmapPhase {
  id: string;
  roadmap_id: string;
  title: string;
  description: string | null;
  display_order: number;
  is_published: boolean;
  created_at: string;
  lessons?: RoadmapLesson[];
}

export interface RoadmapLesson {
  id: string;
  phase_id: string;
  title: string;
  description: string | null;
  objectives: string[];
  youtube_url: string | null;
  doc_url: string | null;
  practice_exercise: string | null;
  mini_project: string | null;
  estimated_duration: string | null;
  prerequisites: string | null;
  difficulty: string;
  is_published: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface UserLessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  status: LessonStatus;
  created_at: string;
  updated_at: string;
}

export interface LearningNote {
  id: string;
  user_id: string;
  lesson_id: string | null;
  problem_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  title: string;
  organizer: string | null;
  description: string | null;
  category: EventCategory;
  start_date: string;
  end_date: string | null;
  registration_deadline: string | null;
  timezone: string | null;
  format: string | null;
  eligibility: string | null;
  prize_details: string | null;
  registration_url: string | null;
  event_url: string | null;
  status: EventStatus;
  banner_url: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventBookmark {
  id: string;
  user_id: string;
  event_id: string;
  created_at: string;
}

export interface Discussion {
  id: string;
  author_id: string;
  title: string;
  content: string;
  category: DiscussionCategory;
  tags: string[];
  upvotes: number;
  created_at: string;
  updated_at: string;
  author?: Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'college'>;
  comment_count?: number;
  has_upvoted?: boolean;
  has_bookmarked?: boolean;
}

export interface DiscussionComment {
  id: string;
  discussion_id: string;
  author_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  author?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>;
  replies?: DiscussionComment[];
}

export interface Community {
  id: string;
  name: string;
  description: string | null;
  college: string | null;
  topic: string | null;
  membership_rule: string;
  announcement: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  member_count?: number;
  has_joined?: boolean;
  membership_role?: string;
}

export interface CommunityMembership {
  id: string;
  community_id: string;
  user_id: string;
  role: 'Owner' | 'Admin' | 'Member';
  joined_at: string;
}

export interface Conversation {
  id: string;
  created_at: string;
  other_user?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>;
  last_message?: { content: string; created_at: string };
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  status: 'Draft' | 'Published' | 'Archived';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ContentReport {
  id: string;
  reporter_id: string;
  target_type: string;
  target_id: string;
  reason: string;
  status: 'Pending' | 'Resolved' | 'Dismissed';
  created_at: string;
}

export interface UserPreferences {
  user_id: string;
  preferred_difficulty: Difficulty;
  weekly_goal: number;
  notifications_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  admin_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: string | null;
  created_at: string;
}
