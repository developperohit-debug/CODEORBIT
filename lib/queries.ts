'use client';

import { supabase } from '@/lib/supabase';
import type {
  DsaProblem,
  DsaTopic,
  UserProblemProgress,
  ProblemBookmark,
  Roadmap,
  RoadmapPhase,
  RoadmapLesson,
  UserLessonProgress,
  Event,
  EventBookmark,
  Discussion,
  DiscussionComment,
  Community,
  Profile,
  Announcement,
} from '@/lib/types';

// ----- DSA -----
export async function fetchTopics(): Promise<DsaTopic[]> {
  const { data, error } = await supabase.from('dsa_topics').select('*').order('display_order');
  if (error) throw error;
  return data as DsaTopic[];
}

export async function fetchProblems(opts?: {
  topicId?: string;
  difficulty?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ problems: DsaProblem[]; total: number }> {
  const page = opts?.page ?? 1;
  const pageSize = opts?.pageSize ?? 12;
  let q = supabase.from('dsa_problems').select('*, topic:dsa_topics(*)', { count: 'exact' });
  q = q.eq('is_published', true);
  if (opts?.topicId) q = q.eq('topic_id', opts.topicId);
  if (opts?.difficulty && opts.difficulty !== 'all') q = q.eq('difficulty', opts.difficulty);
  if (opts?.search) q = q.ilike('title', `%${opts.search}%`);
  q = q.range((page - 1) * pageSize, page * pageSize - 1).order('title');
  const { data, error, count } = await q;
  if (error) throw error;
  return { problems: (data as DsaProblem[]) || [], total: count ?? 0 };
}

export async function fetchProblem(id: string): Promise<DsaProblem | null> {
  const { data, error } = await supabase
    .from('dsa_problems')
    .select('*, topic:dsa_topics(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as DsaProblem | null;
}

export async function fetchUserProgress(userId: string): Promise<UserProblemProgress[]> {
  const { data, error } = await supabase.from('user_problem_progress').select('*').eq('user_id', userId);
  if (error) throw error;
  return data as UserProblemProgress[];
}

export async function upsertProblemProgress(userId: string, problemId: string, status: string) {
  const { error } = await supabase
    .from('user_problem_progress')
    .upsert({ user_id: userId, problem_id: problemId, status }, { onConflict: 'user_id,problem_id' });
  if (error) throw error;
}

export async function fetchProblemBookmarks(userId: string): Promise<ProblemBookmark[]> {
  const { data, error } = await supabase.from('problem_bookmarks').select('*').eq('user_id', userId);
  if (error) throw error;
  return data as ProblemBookmark[];
}

export async function toggleProblemBookmark(userId: string, problemId: string, bookmarked: boolean) {
  if (bookmarked) {
    const { error } = await supabase.from('problem_bookmarks').insert({ user_id: userId, problem_id: problemId });
    if (error) throw error;
  } else {
    const { error } = await supabase.from('problem_bookmarks').delete().eq('user_id', userId).eq('problem_id', problemId);
    if (error) throw error;
  }
}

// ----- Roadmaps -----
export async function fetchRoadmaps(): Promise<Roadmap[]> {
  const { data, error } = await supabase.from('roadmaps').select('*').eq('is_published', true).order('created_at');
  if (error) throw error;
  return data as Roadmap[];
}

export async function fetchRoadmapWithPhases(roadmapId: string): Promise<{ roadmap: Roadmap | null; phases: RoadmapPhase[] }> {
  const { data: roadmap } = await supabase.from('roadmaps').select('*').eq('id', roadmapId).maybeSingle();
  const { data: phases } = await supabase
    .from('roadmap_phases')
    .select('*')
    .eq('roadmap_id', roadmapId)
    .eq('is_published', true)
    .order('display_order');
  return { roadmap: roadmap as Roadmap | null, phases: (phases as RoadmapPhase[]) || [] };
}

export async function fetchPhaseLessons(phaseId: string): Promise<RoadmapLesson[]> {
  const { data, error } = await supabase
    .from('roadmap_lessons')
    .select('*')
    .eq('phase_id', phaseId)
    .eq('is_published', true)
    .order('display_order');
  if (error) throw error;
  return data as RoadmapLesson[];
}

export async function fetchUserLessonProgress(userId: string): Promise<UserLessonProgress[]> {
  const { data, error } = await supabase.from('user_lesson_progress').select('*').eq('user_id', userId);
  if (error) throw error;
  return data as UserLessonProgress[];
}

export async function upsertLessonProgress(userId: string, lessonId: string, status: string) {
  const { error } = await supabase
    .from('user_lesson_progress')
    .upsert({ user_id: userId, lesson_id: lessonId, status }, { onConflict: 'user_id,lesson_id' });
  if (error) throw error;
}

// ----- Events -----
export async function fetchEvents(opts?: { category?: string; search?: string }): Promise<Event[]> {
  let q = supabase.from('events').select('*').eq('is_published', true);
  if (opts?.category && opts.category !== 'all') q = q.eq('category', opts.category);
  if (opts?.search) q = q.ilike('title', `%${opts.search}%`);
  q = q.order('start_date');
  const { data, error } = await q;
  if (error) throw error;
  return data as Event[];
}

export async function fetchEventBookmarks(userId: string): Promise<EventBookmark[]> {
  const { data, error } = await supabase.from('event_bookmarks').select('*').eq('user_id', userId);
  if (error) throw error;
  return data as EventBookmark[];
}

export async function toggleEventBookmark(userId: string, eventId: string, bookmarked: boolean) {
  if (bookmarked) {
    const { error } = await supabase.from('event_bookmarks').insert({ user_id: userId, event_id: eventId });
    if (error) throw error;
  } else {
    const { error } = await supabase.from('event_bookmarks').delete().eq('user_id', userId).eq('event_id', eventId);
    if (error) throw error;
  }
}

// ----- Discussions -----
export async function fetchDiscussions(opts?: { category?: string; search?: string; page?: number; pageSize?: number }): Promise<Discussion[]> {
  const page = opts?.page ?? 1;
  const pageSize = opts?.pageSize ?? 10;
  let q = supabase
    .from('discussions')
    .select('*, author:profiles!discussions_author_id_fkey(id, full_name, avatar_url, college)')
    .order('created_at', { ascending: false });
  if (opts?.category && opts.category !== 'all') q = q.eq('category', opts.category);
  if (opts?.search) q = q.ilike('title', `%${opts.search}%`);
  q = q.range((page - 1) * pageSize, page * pageSize - 1);
  const { data, error } = await q;
  if (error) throw error;
  return data as Discussion[];
}

export async function fetchDiscussion(id: string): Promise<Discussion | null> {
  const { data, error } = await supabase
    .from('discussions')
    .select('*, author:profiles!discussions_author_id_fkey(id, full_name, avatar_url, college)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as Discussion | null;
}

export async function fetchComments(discussionId: string): Promise<DiscussionComment[]> {
  const { data, error } = await supabase
    .from('discussion_comments')
    .select('*, author:profiles!discussion_comments_author_id_fkey(id, full_name, avatar_url)')
    .eq('discussion_id', discussionId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data as DiscussionComment[];
}

export async function createDiscussion(authorId: string, title: string, content: string, category: string, tags: string[]) {
  const { data, error } = await supabase
    .from('discussions')
    .insert({ author_id: authorId, title, content, category, tags })
    .select('id')
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function addComment(discussionId: string, authorId: string, content: string, parentId?: string) {
  const { error } = await supabase
    .from('discussion_comments')
    .insert({ discussion_id: discussionId, author_id: authorId, content, parent_id: parentId ?? null });
  if (error) throw error;
}

export async function toggleUpvote(userId: string, discussionId: string, hasUpvoted: boolean) {
  if (hasUpvoted) {
    const { error } = await supabase.from('discussion_votes').delete().eq('user_id', userId).eq('discussion_id', discussionId);
    if (error) throw error;
    await supabase.rpc('decrement_upvote', { d_id: discussionId });
  } else {
    const { error } = await supabase.from('discussion_votes').insert({ user_id: userId, discussion_id: discussionId });
    if (error) throw error;
    await supabase.rpc('increment_upvote', { d_id: discussionId });
  }
}

export async function toggleDiscussionBookmark(userId: string, discussionId: string, bookmarked: boolean) {
  if (bookmarked) {
    const { error } = await supabase.from('discussion_bookmarks').insert({ user_id: userId, discussion_id: discussionId });
    if (error) throw error;
  } else {
    const { error } = await supabase.from('discussion_bookmarks').delete().eq('user_id', userId).eq('discussion_id', discussionId);
    if (error) throw error;
  }
}

// ----- Community -----
export async function fetchCommunities(): Promise<Community[]> {
  const { data, error } = await supabase.from('communities').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data as Community[];
}

export async function fetchProfiles(opts?: { search?: string; college?: string }): Promise<Profile[]> {
  let q = supabase.from('profiles').select('*').eq('is_public', true).eq('suspended', false);
  if (opts?.search) q = q.ilike('full_name', `%${opts.search}%`);
  if (opts?.college) q = q.ilike('college', `%${opts.college}%`);
  q = q.order('created_at', { ascending: false }).limit(50);
  const { data, error } = await q;
  if (error) throw error;
  return data as Profile[];
}

export async function fetchProfile(id: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

// ----- Announcements -----
export async function fetchAnnouncements(): Promise<Announcement[]> {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('status', 'Published')
    .order('created_at', { ascending: false })
    .limit(5);
  if (error) throw error;
  return data as Announcement[];
}

// ----- Messages -----
export async function fetchConversations(userId: string) {
  const { data, error } = await supabase
    .from('conversation_participants')
    .select('conversation_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchMessages(conversationId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}
