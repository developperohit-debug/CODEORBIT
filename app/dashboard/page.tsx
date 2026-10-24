'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CircleDot,
  Flame,
  Target,
  TrendingUp,
  Clock,
  Compass,
  Lightbulb,
  Calendar,
  ChevronRight,
  Zap,
  Trophy,
  Activity,
} from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { ActivityHeatmap } from '@/components/activity-heatmap';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { recommendProblems } from '@/lib/recommendations';
import type { DsaProblem, UserProblemProgress, DsaTopic, RoadmapLesson, UserLessonProgress, RoadmapPhase, Roadmap, Event, Announcement, UserPreferences } from '@/lib/types';
import { computeEventStatus, formatDate, timeAgo, difficultyColor } from '@/lib/format';

interface ActivityEntry {
  id: string;
  type: 'problem' | 'lesson' | 'goal';
  title: string;
  detail: string;
  timestamp: string;
}

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<UserProblemProgress[]>([]);
  const [problems, setProblems] = useState<DsaProblem[]>([]);
  const [topics, setTopics] = useState<DsaTopic[]>([]);
  const [lessonProgress, setLessonProgress] = useState<UserLessonProgress[]>([]);
  const [allLessons, setAllLessons] = useState<(RoadmapLesson & { phase?: RoadmapPhase })[]>([]);
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [focusDone, setFocusDone] = useState<Set<string>>(new Set());
  const [heatmapRange, setHeatmapRange] = useState<30 | 90 | 365>(90);
  const [savingGoal, setSavingGoal] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [
          probRes, progRes, topicRes, lessonProgRes, lessonRes,
          eventRes, annRes, prefRes, rmRes, phaseRes,
        ] = await Promise.all([
          supabase.from('dsa_problems').select('*').eq('is_published', true),
          supabase.from('user_problem_progress').select('*').eq('user_id', user.id),
          supabase.from('dsa_topics').select('*').order('display_order'),
          supabase.from('user_lesson_progress').select('*').eq('user_id', user.id),
          supabase.from('roadmap_lessons').select('*, phase:roadmap_phases(*)').eq('is_published', true),
          supabase.from('events').select('*').eq('is_published', true).order('start_date').limit(4),
          supabase.from('announcements').select('*').eq('status', 'Published').order('created_at', { ascending: false }).limit(3),
          supabase.from('user_preferences').select('*').eq('user_id', user.id).maybeSingle(),
          supabase.from('roadmaps').select('*').eq('is_published', true),
          supabase.from('roadmap_phases').select('*').eq('is_published', true).order('display_order'),
        ]);
        setProblems((probRes.data as DsaProblem[]) || []);
        setProgress((progRes.data as UserProblemProgress[]) || []);
        setTopics((topicRes.data as DsaTopic[]) || []);
        setLessonProgress((lessonProgRes.data as UserLessonProgress[]) || []);
        setAllLessons((lessonRes.data as any[]) || []);
        setEvents((eventRes.data as Event[]) || []);
        setAnnouncements((annRes.data as Announcement[]) || []);
        setPreferences(prefRes.data as UserPreferences | null);
        setRoadmaps((rmRes.data as Roadmap[]) || []);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  // --- Derived statistics ---
  const solvedStatuses = new Set(['Solved with Hints', 'Solved Independently']);
  const solved = progress.filter((p) => solvedStatuses.has(p.status));
  const totalLessons = allLessons.length;

  // Streak: consecutive days with any activity ending today or yesterday
  const streak = useMemo(() => {
    const activityDates = new Set(
      [...progress, ...lessonProgress].map((p) => new Date(p.updated_at).toDateString())
    );
    let count = 0;
    const cursor = new Date();
    // Allow today to be empty — streak counts from yesterday backward if today has no activity
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (!activityDates.has(today.toDateString()) && !activityDates.has(yesterday.toDateString())) {
      return 0;
    }
    // Start from today if active, otherwise yesterday
    const start = activityDates.has(today.toDateString()) ? today : yesterday;
    const check = new Date(start);
    while (activityDates.has(check.toDateString())) {
      count++;
      check.setDate(check.getDate() - 1);
    }
    return count;
  }, [progress, lessonProgress]);

  const completedLessons = lessonProgress.filter((l) => l.status === 'Completed').length;
  const lessonPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const weeklyGoal = preferences?.weekly_goal ?? 5;
  const solvedThisWeek = solved.filter((p) => {
    return Date.now() - new Date(p.updated_at).getTime() < 7 * 24 * 60 * 60 * 1000;
  }).length;
  const goalPct = weeklyGoal > 0 ? Math.min(100, Math.round((solvedThisWeek / weeklyGoal) * 100)) : 0;

  // --- Activity heatmap data ---
  const heatmapActivity = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of progress) {
      const date = new Date(p.updated_at).toISOString().slice(0, 10);
      map.set(date, (map.get(date) || 0) + 1);
    }
    for (const l of lessonProgress) {
      if (l.status === 'Completed') {
        const date = new Date(l.updated_at).toISOString().slice(0, 10);
        map.set(date, (map.get(date) || 0) + 1);
      }
    }
    return Array.from(map.entries()).map(([date, count]) => ({ date, count }));
  }, [progress, lessonProgress]);

  // --- Recent activity feed ---
  const recentActivity = useMemo((): ActivityEntry[] => {
    const entries: ActivityEntry[] = [];

    for (const p of progress) {
      const problem = problems.find((pr) => pr.id === p.problem_id);
      if (problem) {
        entries.push({
          id: `prob-${p.id}`,
          type: 'problem',
          title: problem.title,
          detail: p.status,
          timestamp: p.updated_at,
        });
      }
    }
    for (const l of lessonProgress) {
      const lesson = allLessons.find((al) => al.id === l.lesson_id);
      if (lesson) {
        entries.push({
          id: `lesson-${l.id}`,
          type: 'lesson',
          title: lesson.title,
          detail: l.status,
          timestamp: l.updated_at,
        });
      }
    }

    return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 8);
  }, [progress, problems, lessonProgress, allLessons]);

  // --- Roadmap progress ---
  const currentRoadmap = roadmaps[0] || null;
  const currentPhase = useMemo(() => {
    if (!allLessons.length) return null;
    // Find the first lesson that is not completed
    const inProgress = lessonProgress.find((lp) => {
      const lesson = allLessons.find((al) => al.id === lp.lesson_id);
      return lesson && (lp.status === 'Learning' || lp.status === 'Practicing');
    });
    if (inProgress) {
      const lesson = allLessons.find((al) => al.id === inProgress.lesson_id);
      return lesson?.phase || null;
    }
    // Find first unstarted lesson
    const unstarted = allLessons.find((al) => !lessonProgress.find((lp) => lp.lesson_id === al.id));
    return unstarted?.phase || null;
  }, [allLessons, lessonProgress]);

  const nextLesson = useMemo(() => {
    const inProgress = lessonProgress.find((lp) => {
      return allLessons.find((al) => al.id === lp.lesson_id && (lp.status === 'Learning' || lp.status === 'Practicing'));
    });
    if (inProgress) return allLessons.find((al) => al.id === inProgress.lesson_id) || null;
    return allLessons.find((al) => !lessonProgress.find((lp) => lp.lesson_id === al.id)) || null;
  }, [allLessons, lessonProgress]);

  const resumeLessonId = nextLesson?.id;

  // --- Focus / recommendations ---
  const recommendations = recommendProblems(problems, progress, preferences?.preferred_difficulty || 'Easy', 3);
  const revisionProblems = progress.filter((p) => p.status === 'Needs Revision').map((p) => problems.find((pr) => pr.id === p.problem_id)).filter(Boolean) as DsaProblem[];

  const focusItems = useMemo(() => {
    const items: { id: string; label: string; href: string; icon: React.ElementType; available: boolean }[] = [];

    if (revisionProblems.length > 0) {
      items.push({
        id: 'review',
        label: `Review ${revisionProblems.length} problem${revisionProblems.length > 1 ? 's' : ''} marked for revision`,
        href: `/dsa/${revisionProblems[0].id}`,
        icon: Target,
        available: true,
      });
    }

    const remaining = Math.max(0, weeklyGoal - solvedThisWeek);
    if (remaining > 0) {
      items.push({
        id: 'solve',
        label: `Solve ${remaining} more problem${remaining > 1 ? 's' : ''} to hit your weekly goal`,
        href: '/dsa',
        icon: Compass,
        available: true,
      });
    }

    if (nextLesson) {
      items.push({
        id: 'lesson',
        label: `Continue: ${nextLesson.title}`,
        href: '/roadmaps',
        icon: BookOpen,
        available: true,
      });
    }

    if (recommendations.length > 0) {
      items.push({
        id: 'practice',
        label: `Practice: ${recommendations[0].problem.title}`,
        href: `/dsa/${recommendations[0].problem.id}`,
        icon: Lightbulb,
        available: true,
      });
    }

    if (items.length === 0) {
      items.push({
        id: 'browse',
        label: 'Browse the DSA tracker to start solving problems',
        href: '/dsa',
        icon: Compass,
        available: true,
      });
    }

    return items;
  }, [revisionProblems, weeklyGoal, solvedThisWeek, nextLesson, recommendations]);

  // --- Time-based greeting ---
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    if (hour < 21) return 'Good evening';
    return 'Good night';
  }, []);
  const firstName = profile?.full_name?.split(' ')[0] || profile?.username || 'there';
  const motivationalSub = useMemo(() => {
    const subs = [
      'Small steps. Consistent progress. Better developers.',
      'Every problem solved is a step closer to your goal.',
      'Consistency beats intensity. Keep showing up.',
      'Your future self will thank you for today\'s effort.',
    ];
    return subs[new Date().getDate() % subs.length];
  }, []);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const upcomingEvents = events
    .map((e) => ({ ...e, computedStatus: computeEventStatus(e.start_date, e.end_date, e.status) }))
    .filter((e) => e.computedStatus === 'Upcoming' || e.computedStatus === 'Ongoing');

  // --- Goal update ---
  const updateWeeklyGoal = useCallback(async (newGoal: number) => {
    if (!user) return;
    setSavingGoal(true);
    if (preferences) {
      const { error } = await supabase.from('user_preferences').update({ weekly_goal: newGoal }).eq('user_id', user.id);
      if (!error) setPreferences({ ...preferences, weekly_goal: newGoal });
    } else {
      const { error } = await supabase.from('user_preferences').insert({ user_id: user.id, weekly_goal: newGoal });
      if (!error) setPreferences({ user_id: user.id, preferred_difficulty: 'Easy', weekly_goal: newGoal, notifications_enabled: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as UserPreferences);
    }
    setSavingGoal(false);
  }, [user, preferences]);

  return (
    <AppShell>
      {/* Welcome Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{today}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{greeting}, {firstName}</h1>
          <p className="mt-1 text-muted-foreground">{motivationalSub}</p>
        </div>
        <div className="flex flex-shrink-0 gap-2">
          <Button asChild>
            <Link href="/dsa">
              <Compass className="mr-2 h-4 w-4" /> Continue Learning
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dsa">DSA Tracker</Link>
          </Button>
        </div>
      </div>

      {/* Announcements banner */}
      {announcements.length > 0 && (
        <div className="mb-6 space-y-2">
          {announcements.map((a) => (
            <div key={a.id} className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
              <Badge variant="outline" className="border-primary/30 text-accent">Announcement</Badge>
              <span className="text-sm font-medium">{a.title}</span>
              <span className="ml-auto text-xs text-muted-foreground">{timeAgo(a.created_at)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={CheckCircle2}
          label="Problems Solved"
          value={loading ? null : solved.length}
          caption={`${solved.length} of ${problems.length} published`}
          loading={loading}
          color="text-success"
          colorBg="bg-success/10"
        />
        <StatCard
          icon={Flame}
          label="Current Streak"
          value={loading ? null : `${streak}d`}
          caption={streak > 0 ? `Active streak — keep it going!` : 'Solve a problem today to start'}
          loading={loading}
          color="text-accent"
          colorBg="bg-accent/10"
        />
        <StatCard
          icon={BookOpen}
          label="Roadmap Progress"
          value={loading ? null : `${lessonPct}%`}
          caption={`${completedLessons} of ${totalLessons} lessons completed`}
          loading={loading}
          color="text-primary"
          colorBg="bg-primary/10"
        />
        <StatCard
          icon={Target}
          label="Weekly Goal"
          value={loading ? null : `${solvedThisWeek}/${weeklyGoal}`}
          caption={goalPct >= 100 ? 'Goal achieved!' : `${Math.max(0, weeklyGoal - solvedThisWeek)} to go`}
          loading={loading}
          color="text-warning"
          colorBg="bg-warning/10"
        />
      </div>

      {/* Coding Activity Heatmap */}
      <Card className="mt-6 animate-fade-in">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4 text-primary" /> Coding Activity
              </CardTitle>
              <CardDescription>Your daily learning activity over time.</CardDescription>
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-elevated p-0.5">
              {([30, 90, 365] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setHeatmapRange(r)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    heatmapRange === r ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {r === 365 ? '1Y' : `${r}D`}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-32 w-full" />
          ) : heatmapActivity.length === 0 ? (
            <EmptyState
              icon={Activity}
              text="No activity recorded yet. Start solving problems or completing lessons to fill in your activity graph."
              action={{ label: 'Go to DSA Tracker', href: '/dsa' }}
            />
          ) : (
            <ActivityHeatmap activity={heatmapActivity} days={heatmapRange} />
          )}
        </CardContent>
      </Card>

      {/* Main content grid */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Left column: Focus Today + Recent Activity */}
        <div className="space-y-6 lg:col-span-2">
          {/* Focus Today */}
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="h-4 w-4 text-accent" /> Your Focus Today
              </CardTitle>
              <CardDescription>Recommended next actions based on your progress and goals.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : (
                focusItems.map((item) => {
                  const done = focusDone.has(item.id);
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-lg border border-border/60 bg-elevated p-3 transition-colors hover:border-primary/30"
                    >
                      <button
                        onClick={() =>
                          setFocusDone((prev) => {
                            const next = new Set(prev);
                            if (next.has(item.id)) next.delete(item.id);
                            else next.add(item.id);
                            return next;
                          })
                        }
                        className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition-colors"
                        style={{ borderColor: done ? 'hsl(var(--success))' : 'hsl(var(--border))', background: done ? 'hsl(var(--success))' : 'transparent' }}
                        aria-label={done ? 'Mark as not done' : 'Mark as done'}
                      >
                        {done && <CheckCircle2 className="h-4 w-4 text-white" />}
                      </button>
                      <item.icon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      <span className={`flex-1 text-sm ${done ? 'text-muted-foreground line-through' : ''}`}>{item.label}</span>
                      <Link href={item.href} className="flex-shrink-0">
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                          Go <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card className="animate-fade-in" style={{ animationDelay: '50ms' }}>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Recommended Problems</CardTitle>
                <CardDescription>Based on your level and progress.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dsa">View all <ArrowRight className="ml-1 h-3 w-3" /></Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <Skeleton className="h-20 w-full" />
              ) : recommendations.length === 0 ? (
                <EmptyState text="No recommendations yet. Start solving problems to get personalized suggestions." />
              ) : (
                recommendations.map(({ problem, reason }) => (
                  <Link
                    key={problem.id}
                    href={`/dsa/${problem.id}`}
                    className="block rounded-lg border border-border/60 bg-elevated p-4 transition-colors hover:border-primary/40"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="font-medium">{problem.title}</div>
                        <p className="mt-1 text-xs text-muted-foreground">{reason}</p>
                      </div>
                      <span className={`rounded-md border px-2 py-0.5 text-xs font-medium ${difficultyColor(problem.difficulty)}`}>
                        {problem.difficulty}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="animate-fade-in" style={{ animationDelay: '100ms' }}>
            <CardHeader>
              <CardTitle className="text-base">Recent Activity</CardTitle>
              <CardDescription>Your latest learning actions and updates.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : recentActivity.length === 0 ? (
                <EmptyState
                  icon={Activity}
                  text="No activity yet. Start solving problems or completing lessons to see your activity here."
                  action={{ label: 'Browse Problems', href: '/dsa' }}
                />
              ) : (
                <div className="space-y-1">
                  {recentActivity.map((entry) => (
                    <div key={entry.id} className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-elevated">
                      <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
                        entry.type === 'problem' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'
                      }`}>
                        {entry.type === 'problem' ? <Code2 className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{entry.title}</p>
                        <p className="text-xs text-muted-foreground">{entry.detail}</p>
                      </div>
                      <span className="flex-shrink-0 text-xs text-muted-foreground">{timeAgo(entry.timestamp)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: Roadmap + Weekly Goal + Events */}
        <div className="space-y-6">
          {/* Roadmap Progress */}
          <Card className="animate-fade-in">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Learning Roadmap</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/roadmaps">Open</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-32 w-full" />
              ) : !currentRoadmap ? (
                <EmptyState text="No roadmaps available yet." />
              ) : (
                <>
                  <div className="mb-3 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-3.5 w-3.5 text-primary" />
                      <span className="text-sm font-medium">{currentRoadmap.name}</span>
                    </div>
                    {currentPhase && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <ChevronRight className="h-3 w-3" /> {currentPhase.title}
                      </div>
                    )}
                  </div>
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{completedLessons} of {totalLessons} lessons</span>
                    <span className="font-medium">{lessonPct}%</span>
                  </div>
                  <Progress value={lessonPct} className="h-2" />
                  {nextLesson && (
                    <div className="mt-3 rounded-lg border border-border/60 bg-elevated p-3">
                      <p className="text-xs text-muted-foreground">Next lesson</p>
                      <p className="mt-0.5 text-sm font-medium">{nextLesson.title}</p>
                      {resumeLessonId && (
                        <Button variant="outline" size="sm" className="mt-2 w-full" asChild>
                          <Link href="/roadmaps">
                            <Clock className="mr-2 h-3.5 w-3.5" /> Resume Learning
                          </Link>
                        </Button>
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Weekly Goal */}
          <Card className="animate-fade-in" style={{ animationDelay: '50ms' }}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="h-4 w-4 text-accent" /> Weekly Goal
                </CardTitle>
                <Select
                  value={String(weeklyGoal)}
                  onValueChange={(v) => updateWeeklyGoal(Number(v))}
                  disabled={savingGoal}
                >
                  <SelectTrigger className="h-7 w-auto text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[3, 5, 7, 10, 15, 20].map((n) => (
                      <SelectItem key={n} value={String(n)}>{n}/wk</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-16 w-full" />
              ) : (
                <>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{solvedThisWeek} of {weeklyGoal} problems</span>
                    <span className="font-medium">{goalPct}%</span>
                  </div>
                  <Progress value={goalPct} className="h-2.5" />
                  <p className="mt-2 text-xs text-muted-foreground">
                    {goalPct >= 100 ? 'Goal achieved! Great work.' : `${Math.max(0, weeklyGoal - solvedThisWeek)} more to reach your weekly goal.`}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Topic progress */}
          <Card className="animate-fade-in" style={{ animationDelay: '100ms' }}>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">DSA Topic Progress</CardTitle>
                <CardDescription>Solved problems per topic.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dsa">All</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <Skeleton className="h-32 w-full" />
              ) : (() => {
                const topicMap = new Map<string, string>();
                topics.forEach((t) => topicMap.set(t.id, t.name));
                const topicData = topics
                  .map((t) => {
                    const topicProblems = problems.filter((p) => p.topic_id === t.id);
                    const topicSolved = solved.filter((sp) => problems.find((pr) => pr.id === sp.problem_id)?.topic_id === t.id).length;
                    return { name: t.name, solved: topicSolved, total: topicProblems.length };
                  })
                  .filter((t) => t.total > 0)
                  .sort((a, b) => b.solved - a.solved)
                  .slice(0, 6);
                if (topicData.length === 0) {
                  return <EmptyState text="No topics with problems yet." />;
                }
                return topicData.map((t) => {
                  const pct = t.total > 0 ? Math.round((t.solved / t.total) * 100) : 0;
                  return (
                    <div key={t.name}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-medium">{t.name}</span>
                        <span className="text-muted-foreground">{t.solved}/{t.total}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                });
              })()}
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card className="animate-fade-in" style={{ animationDelay: '150ms' }}>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Upcoming Events</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/opportunities">All</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <Skeleton className="h-16 w-full" />
              ) : upcomingEvents.length === 0 ? (
                <EmptyState text="No upcoming events right now." />
              ) : (
                upcomingEvents.slice(0, 3).map((e) => (
                  <Link key={e.id} href={`/opportunities/${e.id}`} className="block rounded-lg border border-border/60 bg-elevated p-3 transition-colors hover:border-primary/40">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{e.title}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{e.category} · {formatDate(e.start_date)}</p>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function StatCard({
  icon: Icon, label, value, caption, loading, color, colorBg,
}: {
  icon: React.ElementType; label: string; value: string | number | null;
  caption: string; loading: boolean; color: string; colorBg: string;
}) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-full" />
          </div>
        ) : (
          <>
            <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${colorBg}`}>
              <Icon className={`h-4.5 w-4.5 ${color}`} />
            </div>
            <div className="text-2xl font-bold tracking-tight">{value}</div>
            <p className="mt-0.5 text-sm font-medium text-foreground">{label}</p>
            <p className="text-xs text-muted-foreground">{caption}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState({ text, icon: Icon, action }: { text: string; icon?: React.ElementType; action?: { label: string; href: string } }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
      {Icon && <Icon className="h-8 w-8 text-muted-foreground/50" />}
      <p className="text-sm text-muted-foreground">{text}</p>
      {action && (
        <Button variant="outline" size="sm" asChild>
          <Link href={action.href}>{action.label}</Link>
        </Button>
      )}
    </div>
  );
}

function Code2({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}
