'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  BookOpen, Code2, Flag, Calendar, Megaphone, TrendingUp, Users, MessageSquare,
  Shield, ArrowRight, AlertTriangle, CheckCircle2, Clock, UserCheck, Activity,
  GitBranch, ThumbsUp,
} from 'lucide-react';
import { AdminGuard } from '@/components/admin-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/supabase';
import { formatDate, timeAgo, initials } from '@/lib/format';

interface AdminStats {
  totalUsers: number;
  newUsersWeek: number;
  totalProblems: number;
  publishedProblems: number;
  totalLessons: number;
  totalEvents: number;
  upcomingEvents: number;
  pendingReports: number;
  publishedAnnouncements: number;
  totalDiscussions: number;
  totalRoadmaps: number;
  totalCommunities: number;
}

interface RecentUser {
  id: string;
  full_name: string;
  username: string | null;
  college: string | null;
  created_at: string;
}

interface RecentDiscussion {
  id: string;
  title: string;
  category: string;
  upvotes: number;
  created_at: string;
  author_name: string;
}

interface RecentReport {
  id: string;
  target_type: string;
  reason: string;
  status: string;
  created_at: string;
}

const QUICK_ACTIONS = [
  { label: 'Manage Users', href: '/admin/users', icon: Users, description: 'Suspend, search, review accounts' },
  { label: 'DSA Problems', href: '/admin/problems', icon: Code2, description: 'Create and publish problems' },
  { label: 'Roadmaps', href: '/admin/roadmaps', icon: BookOpen, description: 'Build learning paths' },
  { label: 'Events', href: '/admin/events', icon: Calendar, description: 'Post contests & hackathons' },
  { label: 'Reports', href: '/admin/reports', icon: Flag, description: 'Resolve content reports' },
  { label: 'Announcements', href: '/admin/announcements', icon: Megaphone, description: 'Publish platform updates' },
];

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0, newUsersWeek: 0, totalProblems: 0, publishedProblems: 0,
    totalLessons: 0, totalEvents: 0, upcomingEvents: 0, pendingReports: 0,
    publishedAnnouncements: 0, totalDiscussions: 0, totalRoadmaps: 0, totalCommunities: 0,
  });
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentDiscussions, setRecentDiscussions] = useState<RecentDiscussion[]>([]);
  const [pendingReportsList, setPendingReportsList] = useState<RecentReport[]>([]);
  const [userGrowth, setUserGrowth] = useState<{ date: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [
        usersRes, problemsRes, problemsPubRes, lessonsRes,
        eventsRes, eventsUpRes, reportsRes, reportsPendingRes,
        annRes, discRes, rmRes, commRes,
      ] = await Promise.all([
        supabase.from('profiles').select('id, full_name, username, college, created_at', { count: 'exact' }),
        supabase.from('dsa_problems').select('*', { count: 'exact', head: true }),
        supabase.from('dsa_problems').select('*', { count: 'exact', head: true }).eq('is_published', true),
        supabase.from('roadmap_lessons').select('*', { count: 'exact', head: true }),
        supabase.from('events').select('*', { count: 'exact', head: true }).eq('is_published', true),
        supabase.from('events').select('*', { count: 'exact', head: true }).eq('is_published', true).gt('start_date', new Date().toISOString()),
        supabase.from('content_reports').select('*', { count: 'exact', head: true }),
        supabase.from('content_reports').select('id, target_type, reason, status, created_at').eq('status', 'Pending').order('created_at', { ascending: false }).limit(5),
        supabase.from('announcements').select('*', { count: 'exact', head: true }).eq('status', 'Published'),
        supabase.from('discussions').select('id, title, category, upvotes, created_at, author:profiles(full_name)').order('created_at', { ascending: false }).limit(5),
        supabase.from('roadmaps').select('*', { count: 'exact', head: true }),
        supabase.from('communities').select('*', { count: 'exact', head: true }),
      ]);

      const users = (usersRes.data as RecentUser[]) || [];
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const newUsersWeek = users.filter((u) => new Date(u.created_at).getTime() > weekAgo).length;

      setStats({
        totalUsers: usersRes.count ?? 0,
        newUsersWeek,
        totalProblems: problemsRes.count ?? 0,
        publishedProblems: problemsPubRes.count ?? 0,
        totalLessons: lessonsRes.count ?? 0,
        totalEvents: eventsRes.count ?? 0,
        upcomingEvents: eventsUpRes.count ?? 0,
        pendingReports: reportsRes.count ?? 0,
        publishedAnnouncements: annRes.count ?? 0,
        totalDiscussions: discRes.count ?? 0,
        totalRoadmaps: rmRes.count ?? 0,
        totalCommunities: commRes.count ?? 0,
      });

      setRecentUsers(users.slice(0, 6));
      setPendingReportsList((reportsPendingRes.data as RecentReport[]) || []);
      setRecentDiscussions(
        ((discRes.data as any[]) || []).map((d) => ({
          id: d.id,
          title: d.title,
          category: d.category,
          upvotes: d.upvotes,
          created_at: d.created_at,
          author_name: d.author?.full_name || 'Unknown',
        })),
      );

      // Build 7-day user growth chart
      const last7Days: { date: string; count: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const day = new Date();
        day.setHours(0, 0, 0, 0);
        day.setDate(day.getDate() - i);
        const dayEnd = new Date(day);
        dayEnd.setDate(dayEnd.getDate() + 1);
        const count = users.filter((u) => {
          const created = new Date(u.created_at);
          return created >= day && created < dayEnd;
        }).length;
        last7Days.push({
          date: day.toLocaleDateString('en-US', { weekday: 'short' }),
          count,
        });
      }
      setUserGrowth(last7Days);

      setLoading(false);
    })();
  }, []);

  const maxGrowth = useMemo(() => Math.max(...userGrowth.map((d) => d.count), 1), [userGrowth]);

  return (
    <AdminGuard>
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        </div>
        <p className="mt-1 text-muted-foreground">Platform overview, analytics, and quick actions.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total Users"
          value={stats.totalUsers}
          sublabel={`${stats.newUsersWeek} new this week`}
          loading={loading}
          color="primary"
        />
        <StatCard
          icon={Code2}
          label="DSA Problems"
          value={stats.totalProblems}
          sublabel={`${stats.publishedProblems} published`}
          loading={loading}
          color="accent"
        />
        <StatCard
          icon={MessageSquare}
          label="Discussions"
          value={stats.totalDiscussions}
          sublabel={`${stats.totalCommunities} communities`}
          loading={loading}
          color="chart-2"
        />
        <StatCard
          icon={Flag}
          label="Pending Reports"
          value={stats.pendingReports}
          sublabel={stats.pendingReports > 0 ? 'Needs attention' : 'All clear'}
          loading={loading}
          color={stats.pendingReports > 0 ? 'destructive' : 'success'}
          alert={stats.pendingReports > 0}
        />
      </div>

      {/* Secondary stats row */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStat icon={BookOpen} label="Roadmap Lessons" value={stats.totalLessons} loading={loading} />
        <MiniStat icon={GitBranch} label="Roadmaps" value={stats.totalRoadmaps} loading={loading} />
        <MiniStat icon={Calendar} label="Upcoming Events" value={stats.upcomingEvents} loading={loading} />
        <MiniStat icon={Megaphone} label="Announcements" value={stats.publishedAnnouncements} loading={loading} />
      </div>

      {/* Charts and Activity */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* User Growth Chart */}
        <Card className="lg:col-span-2 animate-fade-in">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">New Users — Last 7 Days</CardTitle>
              <Badge variant="outline" className="gap-1">
                <TrendingUp className="h-3 w-3" /> {stats.newUsersWeek} total
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <div className="flex h-40 items-end justify-between gap-2">
                {userGrowth.map((d, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex w-full flex-1 items-end">
                      <div
                        className="w-full rounded-t-md bg-gradient-to-t from-primary/40 to-primary transition-all duration-500 hover:from-primary/60 hover:to-primary"
                        style={{ height: `${(d.count / maxGrowth) * 100}%`, minHeight: '4px' }}
                        title={`${d.count} new users`}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground">{d.date}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="animate-fade-in" style={{ animationDelay: '100ms' }}>
          <CardHeader><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="group flex items-center gap-3 rounded-lg border border-border/60 bg-elevated p-3 transition-all hover:border-primary/30 hover:shadow-sm"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                  <action.icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{action.label}</p>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Row */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Recent Registrations */}
        <Card className="animate-fade-in" style={{ animationDelay: '150ms' }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Registrations</CardTitle>
              <Link href="/admin/users"><Button variant="ghost" size="sm" className="text-xs">View all</Button></Link>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : recentUsers.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No users yet.</p>
            ) : (
              <div className="space-y-2">
                {recentUsers.map((u) => (
                  <div key={u.id} className="flex items-center gap-3 rounded-lg border border-border/40 bg-elevated p-2.5">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/15 text-[10px] text-primary">{initials(u.full_name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{u.full_name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {u.username ? `@${u.username}` : 'No username'} · {u.college || 'No college'}
                      </p>
                    </div>
                    <span className="flex-shrink-0 text-[10px] text-muted-foreground">{timeAgo(u.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Discussions */}
        <Card className="animate-fade-in" style={{ animationDelay: '200ms' }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Discussions</CardTitle>
              <Link href="/discussions"><Button variant="ghost" size="sm" className="text-xs">View all</Button></Link>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : recentDiscussions.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No discussions yet.</p>
            ) : (
              <div className="space-y-2">
                {recentDiscussions.map((d) => (
                  <div key={d.id} className="rounded-lg border border-border/40 bg-elevated p-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-1 text-sm font-medium">{d.title}</p>
                      <span className="flex flex-shrink-0 items-center gap-1 text-xs text-muted-foreground">
                        <ThumbsUp className="h-3 w-3" /> {d.upvotes}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">{d.category}</Badge>
                      <span className="text-[10px] text-muted-foreground">{d.author_name} · {timeAgo(d.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Reports */}
        <Card className="animate-fade-in" style={{ animationDelay: '250ms' }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                Pending Reports
                {stats.pendingReports > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                    {stats.pendingReports}
                  </span>
                )}
              </CardTitle>
              <Link href="/admin/reports"><Button variant="ghost" size="sm" className="text-xs">Review</Button></Link>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : pendingReportsList.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <CheckCircle2 className="h-8 w-8 text-success" />
                <p className="text-sm text-muted-foreground">No pending reports. All clear!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingReportsList.map((r) => (
                  <div key={r.id} className="flex items-start gap-2 rounded-lg border border-warning/20 bg-warning/5 p-2.5">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-warning" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[10px]">{r.target_type}</Badge>
                        <span className="text-[10px] text-muted-foreground">{timeAgo(r.created_at)}</span>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{r.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Feature Overview Cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <FeatureCard
          icon={Code2}
          title="DSA Problems"
          stats={[
            { label: 'Total', value: stats.totalProblems },
            { label: 'Published', value: stats.publishedProblems },
            { label: 'Drafts', value: stats.totalProblems - stats.publishedProblems },
          ]}
          href="/admin/problems"
          loading={loading}
        />
        <FeatureCard
          icon={BookOpen}
          title="Learning Roadmaps"
          stats={[
            { label: 'Roadmaps', value: stats.totalRoadmaps },
            { label: 'Lessons', value: stats.totalLessons },
          ]}
          href="/admin/roadmaps"
          loading={loading}
        />
        <FeatureCard
          icon={Calendar}
          title="Events & Contests"
          stats={[
            { label: 'Published', value: stats.totalEvents },
            { label: 'Upcoming', value: stats.upcomingEvents },
          ]}
          href="/admin/events"
          loading={loading}
        />
        <FeatureCard
          icon={MessageSquare}
          title="Community"
          stats={[
            { label: 'Discussions', value: stats.totalDiscussions },
            { label: 'Communities', value: stats.totalCommunities },
          ]}
          href="/community"
          loading={loading}
        />
        <FeatureCard
          icon={Megaphone}
          title="Announcements"
          stats={[
            { label: 'Published', value: stats.publishedAnnouncements },
          ]}
          href="/admin/announcements"
          loading={loading}
        />
        <FeatureCard
          icon={Users}
          title="User Management"
          stats={[
            { label: 'Total Users', value: stats.totalUsers },
            { label: 'New (7d)', value: stats.newUsersWeek },
          ]}
          href="/admin/users"
          loading={loading}
        />
      </div>
    </AdminGuard>
  );
}

const colorMap: Record<string, string> = {
  primary: 'bg-primary/10 text-primary',
  accent: 'bg-accent/10 text-accent',
  destructive: 'bg-destructive/10 text-destructive',
  success: 'bg-success/10 text-success',
  'chart-2': 'bg-chart-2/10 text-chart-2',
};

function StatCard({
  icon: Icon, label, value, sublabel, loading, color, alert,
}: {
  icon: React.ElementType; label: string; value: number; sublabel: string;
  loading: boolean; color: string; alert?: boolean;
}) {
  return (
    <Card className={alert ? 'border-destructive/20' : ''}>
      <CardContent className="p-5">
        {loading ? (
          <Skeleton className="h-16 w-full" />
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorMap[color] || colorMap.primary}`}>
                <Icon className="h-5 w-5" />
              </div>
              {alert && (
                <span className="flex items-center gap-1 text-xs font-medium text-destructive">
                  <AlertTriangle className="h-3 w-3" /> Action needed
                </span>
              )}
            </div>
            <div className="text-3xl font-bold tracking-tight">{value}</div>
            <p className="mt-0.5 text-sm font-medium text-foreground">{label}</p>
            <p className="text-xs text-muted-foreground">{sublabel}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function MiniStat({ icon: Icon, label, value, loading }: { icon: React.ElementType; label: string; value: number; loading: boolean }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        {loading ? <Skeleton className="h-8 w-full" /> : (
          <>
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-lg font-bold">{value}</span>
            <span className="text-xs text-muted-foreground">{label}</span>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function FeatureCard({
  icon: Icon, title, stats, href, loading,
}: {
  icon: React.ElementType; title: string;
  stats: { label: string; value: number }[]; href: string; loading: boolean;
}) {
  return (
    <Card className="group transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        {loading ? <Skeleton className="h-20 w-full" /> : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold">{title}</h3>
              </div>
              <Link href={href} className="text-muted-foreground transition-colors group-hover:text-primary">
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="flex gap-4">
              {stats.map((s) => (
                <div key={s.label}>
                  <div className="text-xl font-bold">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
