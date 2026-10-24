'use client';

import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Target, BookOpen, Loader2, Activity } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { difficultyColor } from '@/lib/format';
import type { DsaProblem, UserProblemProgress, DsaTopic, RoadmapLesson, UserLessonProgress, Discussion, DiscussionComment } from '@/lib/types';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Pie, PieChart, Cell, Area, AreaChart, CartesianGrid, Legend } from 'recharts';

const PIE_COLORS = ['hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--muted-foreground))'];
const AREA_COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))'];

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [problems, setProblems] = useState<DsaProblem[]>([]);
  const [progress, setProgress] = useState<UserProblemProgress[]>([]);
  const [topics, setTopics] = useState<DsaTopic[]>([]);
  const [lessonProgress, setLessonProgress] = useState<UserLessonProgress[]>([]);
  const [totalLessons, setTotalLessons] = useState(0);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [comments, setComments] = useState<DiscussionComment[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [probRes, progRes, topicRes, lessonProgRes, lessonRes, discRes, commentRes] = await Promise.all([
          supabase.from('dsa_problems').select('*').eq('is_published', true),
          supabase.from('user_problem_progress').select('*').eq('user_id', user.id),
          supabase.from('dsa_topics').select('*'),
          supabase.from('user_lesson_progress').select('*').eq('user_id', user.id),
          supabase.from('roadmap_lessons').select('id, difficulty').eq('is_published', true),
          supabase.from('discussions').select('*').eq('author_id', user.id),
          supabase.from('discussion_comments').select('*').eq('author_id', user.id),
        ]);
        setProblems((probRes.data as DsaProblem[]) || []);
        setProgress((progRes.data as UserProblemProgress[]) || []);
        setTopics((topicRes.data as DsaTopic[]) || []);
        setLessonProgress((lessonProgRes.data as UserLessonProgress[]) || []);
        setTotalLessons(lessonRes.data?.length ?? 0);
        setDiscussions((discRes.data as Discussion[]) || []);
        setComments((commentRes.data as DiscussionComment[]) || []);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const solvedStatuses = new Set(['Solved with Hints', 'Solved Independently']);
  const solved = progress.filter((p) => solvedStatuses.has(p.status));
  const attempted = progress.filter((p) => p.status === 'Attempted');
  const needsRevision = progress.filter((p) => p.status === 'Needs Revision');
  const notStarted = problems.length - progress.length;

  const easySolved = solved.filter((p) => problems.find((pr) => pr.id === p.problem_id)?.difficulty === 'Easy').length;
  const medSolved = solved.filter((p) => problems.find((pr) => pr.id === p.problem_id)?.difficulty === 'Medium').length;
  const hardSolved = solved.filter((p) => problems.find((pr) => pr.id === p.problem_id)?.difficulty === 'Hard').length;

  const difficultyData = [
    { name: 'Easy', value: easySolved },
    { name: 'Medium', value: medSolved },
    { name: 'Hard', value: hardSolved },
  ];

  const statusData = [
    { name: 'Solved', value: solved.length },
    { name: 'Attempted', value: attempted.length },
    { name: 'Needs Revision', value: needsRevision.length },
    { name: 'Not Started', value: notStarted },
  ];

  // Topic coverage
  const topicMap = new Map<string, string>();
  topics.forEach((t) => topicMap.set(t.id, t.name));
  const topicCounts: Record<string, number> = {};
  solved.forEach((p) => {
    const prob = problems.find((pr) => pr.id === p.problem_id);
    if (prob) {
      const tName = topicMap.get(prob.topic_id ?? '') || 'Unknown';
      topicCounts[tName] = (topicCounts[tName] || 0) + 1;
    }
  });
  const topicData = Object.entries(topicCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // 30-day activity (problems + comments + discussions)
  const activityData = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    const dStr = date.toDateString();
    const probCount = progress.filter((p) => new Date(p.updated_at).toDateString() === dStr).length;
    const discCount = discussions.filter((d) => new Date(d.created_at).toDateString() === dStr).length;
    const commentCount = comments.filter((c) => new Date(c.created_at).toDateString() === dStr).length;
    return {
      day: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      problems: probCount,
      community: discCount + commentCount,
    };
  });

  const completedLessons = lessonProgress.filter((l) => l.status === 'Completed').length;
  const learningLessons = lessonProgress.filter((l) => l.status === 'Learning').length;
  const practicingLessons = lessonProgress.filter((l) => l.status === 'Practicing').length;
  const lessonPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  // Streak: distinct active days in last 30 days
  const allDates: string[] = [
    ...progress.map((p) => p.updated_at),
    ...discussions.map((d) => d.created_at),
    ...comments.map((c) => c.created_at),
  ];
  const activeDays = new Set(
    allDates
      .filter((dStr) => Date.now() - new Date(dStr).getTime() < 30 * 24 * 60 * 60 * 1000)
      .map((dStr) => new Date(dStr).toDateString())
  );
  const streak = activeDays.size;

  const totalCommunity = discussions.length + comments.length;

  return (
    <AppShell>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Analytics</h1>
        <p className="mt-1 text-muted-foreground">Track your learning activity and community engagement over time.</p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard icon={Target} label="Problems Solved" value={solved.length} sub={`${progress.length} tracked`} color="text-success" />
            <SummaryCard icon={BookOpen} label="Lessons Completed" value={completedLessons} sub={`${lessonPct}% of roadmap`} color="text-primary" />
            <SummaryCard icon={Activity} label="Active Days (30d)" value={streak} sub="learning streak" color="text-accent" />
            <SummaryCard icon={TrendingUp} label="Community Posts" value={totalCommunity} sub={`${discussions.length} discussions`} color="text-warning" />
          </div>

          {/* 30-day activity area chart */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><BarChart3 className="h-5 w-5 text-primary" /> 30-Day Activity</CardTitle>
              <CardDescription>Daily problem interactions and community engagement.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activityData}>
                    <defs>
                      <linearGradient id="cProblems" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="cCommunity" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} interval={4} />
                    <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} width={28} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} labelStyle={{ color: 'hsl(var(--foreground))' }} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Area type="monotone" dataKey="problems" stroke="hsl(var(--primary))" fill="url(#cProblems)" strokeWidth={2} name="Problems" />
                    <Area type="monotone" dataKey="community" stroke="hsl(var(--accent))" fill="url(#cCommunity)" strokeWidth={2} name="Community" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {/* Difficulty breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Difficulty Breakdown</CardTitle>
                <CardDescription>Problems solved by difficulty.</CardDescription>
              </CardHeader>
              <CardContent>
                {solved.length === 0 ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">No problems solved yet. Start practising to see your breakdown.</p>
                ) : (
                  <div className="h-[240px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={difficultyData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(entry) => `${entry.name}: ${entry.value}`} labelLine={false} fontSize={12}>
                          {difficultyData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <div className="mt-4 flex justify-center gap-4">
                  {difficultyData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ background: PIE_COLORS[i] }} />
                      <span className="text-xs text-muted-foreground">{d.name}: {d.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Status distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Problem Status</CardTitle>
                <CardDescription>Where your tracked problems stand.</CardDescription>
              </CardHeader>
              <CardContent>
                {progress.length === 0 ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">No problems tracked yet.</p>
                ) : (
                  <div className="h-[240px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} label={(entry) => `${entry.value}`} labelLine={false} fontSize={12}>
                          {statusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Topic coverage */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Topic Coverage</CardTitle>
                <CardDescription>Number of problems solved per DSA topic (top 10).</CardDescription>
              </CardHeader>
              <CardContent>
                {topicData.length === 0 ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">No topic data yet. Solve problems to see your coverage.</p>
                ) : (
                  <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topicData} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} horizontal={false} />
                        <XAxis type="number" allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={120} />
                        <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} labelStyle={{ color: 'hsl(var(--foreground))' }} cursor={{ fill: 'hsl(var(--muted))' }} />
                        <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Solved" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Roadmap lesson status */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Roadmap Lesson Status</CardTitle>
              <CardDescription>Your progress through web development lessons.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-4">
                <LessonStat label="Completed" value={completedLessons} color="text-success" />
                <LessonStat label="Practicing" value={practicingLessons} color="text-warning" />
                <LessonStat label="Learning" value={learningLessons} color="text-accent" />
                <LessonStat label="Total" value={totalLessons} color="text-muted-foreground" />
              </div>
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Overall progress</span>
                  <span className="font-medium">{lessonPct}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all" style={{ width: `${lessonPct}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </AppShell>
  );
}

function SummaryCard({ icon: Icon, label, value, sub, color }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number | string; sub: string; color: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-elevated">
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold">{value}</p>
          <p className="truncate text-sm text-muted-foreground">{label}</p>
          <p className="truncate text-xs text-muted-foreground/70">{sub}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function LessonStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-elevated p-4 text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
