'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Bookmark, BookmarkCheck, Filter, Search, RotateCcw, ChevronRight, Route } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { difficultyColor, statusColor } from '@/lib/format';
import type { DsaProblem, DsaTopic, UserProblemProgress, ProblemBookmark } from '@/lib/types';

const STATUS_OPTIONS = ['all', 'Not Started', 'Attempted', 'Solved with Hints', 'Solved Independently', 'Needs Revision'];
const DIFFICULTY_OPTIONS = ['all', 'Easy', 'Medium', 'Hard'];
const PLATFORM_OPTIONS = ['all', 'LeetCode'];
const PAGE_SIZE = 12;

export default function DsaPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState<DsaTopic[]>([]);
  const [problems, setProblems] = useState<DsaProblem[]>([]);
  const [progress, setProgress] = useState<UserProblemProgress[]>([]);
  const [bookmarks, setBookmarks] = useState<ProblemBookmark[]>([]);
  const [search, setSearch] = useState('');
  const [topicFilter, setTopicFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const loadProblems = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('dsa_problems').select('*, topic:dsa_topics(*)', { count: 'exact' }).eq('is_published', true);
    if (topicFilter !== 'all') q = q.eq('topic_id', topicFilter);
    if (difficultyFilter !== 'all') q = q.eq('difficulty', difficultyFilter);
    if (platformFilter === 'LeetCode') q = q.not('leetcode_number', 'is', null);
    if (search) q = q.ilike('title', `%${search}%`);
    q = q.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1).order('title');
    const { data, count, error } = await q;
    if (error) {
      toast({ title: 'Failed to load problems', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }
    setProblems((data as DsaProblem[]) || []);
    setTotal(count ?? 0);
    setLoading(false);
  }, [topicFilter, difficultyFilter, platformFilter, search, page, toast]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('dsa_topics').select('*').order('display_order');
      setTopics((data as DsaTopic[]) || []);
    })();
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [pRes, bRes] = await Promise.all([
        supabase.from('user_problem_progress').select('*').eq('user_id', user.id),
        supabase.from('problem_bookmarks').select('*').eq('user_id', user.id),
      ]);
      setProgress((pRes.data as UserProblemProgress[]) || []);
      setBookmarks((bRes.data as ProblemBookmark[]) || []);
    })();
  }, [user]);

  useEffect(() => {
    loadProblems();
  }, [loadProblems]);

  const progressMap = new Map(progress.map((p) => [p.problem_id, p.status]));
  const bookmarkSet = new Set(bookmarks.map((b) => b.problem_id));

  const filteredProblems = statusFilter === 'all'
    ? problems
    : problems.filter((p) => (progressMap.get(p.id) || 'Not Started') === statusFilter);

  // Revision queue: problems the user marked as "Needs Revision"
  const revisionProblems = useMemo(() => {
    return progress
      .filter((p) => p.status === 'Needs Revision')
      .map((p) => problems.find((pr) => pr.id === p.problem_id))
      .filter(Boolean) as DsaProblem[];
  }, [progress, problems]);

  async function toggleBookmark(problemId: string) {
    if (!user) return;
    const isBookmarked = bookmarkSet.has(problemId);
    setBookmarks((prev) =>
      isBookmarked ? prev.filter((b) => b.problem_id !== problemId) : [...prev, { id: '', user_id: user.id, problem_id: problemId, created_at: new Date().toISOString() }]
    );
    try {
      if (isBookmarked) {
        await supabase.from('problem_bookmarks').delete().eq('user_id', user.id).eq('problem_id', problemId);
      } else {
        await supabase.from('problem_bookmarks').insert({ user_id: user.id, problem_id: problemId });
      }
    } catch {
      toast({ title: 'Failed to update bookmark', variant: 'destructive' });
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <AppShell>
      <div className="mb-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">DSA Tracker</h1>
            <p className="mt-1 text-muted-foreground">Browse, filter, and track your progress across {total} problems.</p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dsa/roadmap">
              <Route className="mr-2 h-4 w-4" /> Roadmap View
            </Link>
          </Button>
        </div>
      </div>

      {/* Progress summary */}
      {!loading && progress.length > 0 && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(() => {
            const solvedSet = new Set(['Solved with Hints', 'Solved Independently']);
            const solvedCount = progress.filter((p) => solvedSet.has(p.status)).length;
            const attemptedCount = progress.filter((p) => p.status === 'Attempted').length;
            const revisionCount = progress.filter((p) => p.status === 'Needs Revision').length;
            const trackedCount = progress.length;
            return [
              { label: 'Tracked', value: trackedCount, color: 'text-primary' },
              { label: 'Solved', value: solvedCount, color: 'text-success' },
              { label: 'In Progress', value: attemptedCount, color: 'text-warning' },
              { label: 'Needs Revision', value: revisionCount, color: 'text-destructive' },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="p-4">
                  <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </CardContent>
              </Card>
            ));
          })()}
        </div>
      )}

      {/* Revision Queue */}
      {revisionProblems.length > 0 && (
        <Card className="mb-6 border-destructive/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <RotateCcw className="h-4 w-4 text-destructive" /> Revision Queue
              <Badge variant="outline" className="ml-1 text-destructive">{revisionProblems.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {revisionProblems.slice(0, 8).map((p) => (
                <Link key={p.id} href={`/dsa/${p.id}`}>
                  <Badge variant="outline" className="cursor-pointer hover:border-destructive/40 hover:bg-destructive/5">
                    {p.title}
                    <ChevronRight className="ml-1 h-3 w-3" />
                  </Badge>
                </Link>
              ))}
              {revisionProblems.length > 8 && (
                <span className="text-xs text-muted-foreground">+{revisionProblems.length - 8} more</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search problems..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
        </div>
        <Select value={topicFilter} onValueChange={(v) => { setTopicFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Topic" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Topics</SelectItem>
            {topics.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={difficultyFilter} onValueChange={(v) => { setDifficultyFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Difficulty" /></SelectTrigger>
          <SelectContent>
            {DIFFICULTY_OPTIONS.map((d) => <SelectItem key={d} value={d}>{d === 'all' ? 'All Difficulties' : d}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={platformFilter} onValueChange={(v) => { setPlatformFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Platform" /></SelectTrigger>
          <SelectContent>
            {PLATFORM_OPTIONS.map((p) => <SelectItem key={p} value={p}>{p === 'all' ? 'All Platforms' : p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s === 'all' ? 'All Statuses' : s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Problems grid */}
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      ) : filteredProblems.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Filter className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">No problems match your filters.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProblems.map((problem) => {
              const status = progressMap.get(problem.id) || 'Not Started';
              const isBookmarked = bookmarkSet.has(problem.id);
              return (
                <Card key={problem.id} className="group transition-all hover:border-primary/40">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/dsa/${problem.id}`} className="flex-1">
                        <h3 className="font-medium transition-colors group-hover:text-primary">{problem.title}</h3>
                        {problem.topic && <p className="mt-1 text-xs text-muted-foreground">{problem.topic.name}</p>}
                        {problem.leetcode_number && (
                          <p className="mt-0.5 text-xs text-muted-foreground/70">LeetCode #{problem.leetcode_number}</p>
                        )}
                      </Link>
                      <button onClick={() => toggleBookmark(problem.id)} className="text-muted-foreground hover:text-primary">
                        {isBookmarked ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4" />}
                      </button>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className={`rounded-md border px-2 py-0.5 text-xs font-medium ${difficultyColor(problem.difficulty)}`}>
                        {problem.difficulty}
                      </span>
                      <span className={`rounded-md border px-2 py-0.5 text-xs font-medium ${statusColor(status)}`}>
                        {status}
                      </span>
                      {problem.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}
