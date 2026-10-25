'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Filter,
  RotateCcw,
  Rocket,
  Loader2,
  Target,
} from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { difficultyColor, statusColor } from '@/lib/format';
import type { DsaProblem, DsaTopic, ProblemStatus, UserProblemProgress, ProblemBookmark } from '@/lib/types';

const STATUSES: ProblemStatus[] = ['Not Started', 'Attempted', 'Solved with Hints', 'Solved Independently', 'Needs Revision'];
const SOLVED_SET = new Set<ProblemStatus>(['Solved with Hints', 'Solved Independently']);

interface TopicWithProblems extends DsaTopic {
  problems: DsaProblem[];
}

export default function DsaRoadmapPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState<TopicWithProblems[]>([]);
  const [progress, setProgress] = useState<UserProblemProgress[]>([]);
  const [bookmarks, setBookmarks] = useState<ProblemBookmark[]>([]);
  const [openTopics, setOpenTopics] = useState<Set<string>>(new Set());
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Load all topics with their problems
  useEffect(() => {
    (async () => {
      const [tRes, pRes] = await Promise.all([
        supabase.from('dsa_topics').select('*').order('display_order'),
        supabase.from('dsa_problems').select('*, topic:dsa_topics(*)').eq('is_published', true).order('learning_order', { ascending: true, nullsFirst: false }),
      ]);
      const allTopics = (tRes.data as DsaTopic[]) || [];
      const allProblems = (pRes.data as DsaProblem[]) || [];
      const topicsWithProblems: TopicWithProblems[] = allTopics
        .map((t) => ({ ...t, problems: allProblems.filter((p) => p.topic_id === t.id) }))
        .filter((t) => t.problems.length > 0);
      setTopics(topicsWithProblems);
      setLoading(false);
    })();
  }, []);

  // Load user's progress and bookmarks
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

  const progressMap = useMemo(() => new Map(progress.map((p) => [p.problem_id, p.status])), [progress]);
  const bookmarkSet = useMemo(() => new Set(bookmarks.map((b) => b.problem_id)), [bookmarks]);

  const allProblems = useMemo(() => topics.flatMap((t) => t.problems), [topics]);

  // Overall stats
  const overallStats = useMemo(() => {
    const total = allProblems.length;
    const solved = progress.filter((p) => SOLVED_SET.has(p.status)).length;
    const attempted = progress.filter((p) => p.status === 'Attempted').length;
    const revision = progress.filter((p) => p.status === 'Needs Revision').length;
    const pct = total > 0 ? Math.round((solved / total) * 100) : 0;
    return { total, solved, attempted, revision, pct };
  }, [allProblems, progress]);

  // Auto-expand the first topic with unsolved problems
  useEffect(() => {
    if (!loading && topics.length > 0 && openTopics.size === 0) {
      const firstUnsolvedTopic = topics.find((t) =>
        t.problems.some((p) => !SOLVED_SET.has(progressMap.get(p.id) || 'Not Started'))
      );
      if (firstUnsolvedTopic) {
        setOpenTopics(new Set([firstUnsolvedTopic.id]));
      } else if (topics.length > 0) {
        setOpenTopics(new Set([topics[0].id]));
      }
    }
  }, [loading, topics, progressMap, openTopics.size]);

  const updateStatus = useCallback(async (problemId: string, newStatus: ProblemStatus) => {
    if (!user) return;
    setUpdatingId(problemId);
    setProgress((prev) => {
      const existing = prev.find((p) => p.problem_id === problemId);
      if (existing) return prev.map((p) => (p.problem_id === problemId ? { ...p, status: newStatus, updated_at: new Date().toISOString() } : p));
      return [...prev, { id: '', user_id: user.id, problem_id: problemId, status: newStatus, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }];
    });
    const { error } = await supabase
      .from('user_problem_progress')
      .upsert({ user_id: user.id, problem_id: problemId, status: newStatus }, { onConflict: 'user_id,problem_id' });
    setUpdatingId(null);
    if (error) {
      toast({ title: 'Failed to save', description: error.message, variant: 'destructive' });
    }
  }, [user, toast]);

  const toggleBookmark = useCallback(async (problemId: string) => {
    if (!user) return;
    const isBookmarked = bookmarkSet.has(problemId);
    setBookmarks((prev) =>
      isBookmarked
        ? prev.filter((b) => b.problem_id !== problemId)
        : [...prev, { id: '', user_id: user.id, problem_id: problemId, created_at: new Date().toISOString() }]
    );
    if (isBookmarked) {
      await supabase.from('problem_bookmarks').delete().eq('user_id', user.id).eq('problem_id', problemId);
    } else {
      await supabase.from('problem_bookmarks').insert({ user_id: user.id, problem_id: problemId });
    }
  }, [user, bookmarkSet]);

  // Find next problem to work on (first unsolved across all topics)
  const nextProblem = useMemo(() => {
    for (const topic of topics) {
      for (const p of topic.problems) {
        const st = progressMap.get(p.id) || 'Not Started';
        if (st === 'Attempted' || st === 'Needs Revision') return p;
      }
    }
    for (const topic of topics) {
      for (const p of topic.problems) {
        const st = progressMap.get(p.id) || 'Not Started';
        if (st === 'Not Started') return p;
      }
    }
    return null;
  }, [topics, progressMap]);

  const nextProblemTopic = nextProblem ? topics.find((t) => t.id === nextProblem.topic_id) : null;

  // Filter problems within topics
  const filteredTopics = useMemo(() => {
    return topics.map((t) => ({
      ...t,
      problems: t.problems.filter((p) => {
        if (difficultyFilter !== 'all' && p.difficulty !== difficultyFilter) return false;
        if (statusFilter !== 'all') {
          const st = progressMap.get(p.id) || 'Not Started';
          if (st !== statusFilter) return false;
        }
        return true;
      }),
    })).filter((t) => t.problems.length > 0);
  }, [topics, difficultyFilter, statusFilter, progressMap]);

  const hasActiveFilters = difficultyFilter !== 'all' || statusFilter !== 'all';

  if (loading) {
    return (
      <AppShell>
        <Skeleton className="h-8 w-48" />
        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
        <div className="mt-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Link href="/dsa" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> DSA Tracker
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">DSA Roadmap</h1>
        <p className="mt-1 text-muted-foreground">
          Track your progress through {overallStats.total} problems across {topics.length} topics. Update your status inline — no page loads.
        </p>
      </div>

      {/* Overall progress */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="text-3xl font-bold">{overallStats.pct}%</div>
                <div className="text-sm text-muted-foreground">
                  {overallStats.solved} solved of {overallStats.total}
                </div>
              </div>
              <Progress value={overallStats.pct} className="mt-3 h-2 max-w-md" />
            </div>
            <div className="grid grid-cols-3 gap-4 sm:flex sm:gap-6">
              <div className="text-center">
                <div className="text-xl font-bold text-success">{overallStats.solved}</div>
                <div className="text-xs text-muted-foreground">Solved</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-warning">{overallStats.attempted}</div>
                <div className="text-xs text-muted-foreground">Attempted</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-destructive">{overallStats.revision}</div>
                <div className="text-xs text-muted-foreground">Revision</div>
              </div>
            </div>
          </div>
          {nextProblem && nextProblemTopic && (
            <div className="mt-4 flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Rocket className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Next up:</span>
                <span className="font-medium">{nextProblem.title}</span>
                <Badge variant="outline" className="text-[10px]">{nextProblemTopic.name}</Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOpenTopics((prev) => { const n = new Set(prev); n.add(nextProblemTopic.id); return n; })}
                >
                  <Target className="mr-2 h-3.5 w-3.5" /> Jump to topic
                </Button>
                <Button size="sm" asChild>
                  <Link href={`/dsa/${nextProblem.id}`}>
                    Open problem <ExternalLink className="ml-2 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
          <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Difficulty" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Difficulties</SelectItem>
            <SelectItem value="Easy">Easy</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Hard">Hard</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setDifficultyFilter('all'); setStatusFilter('all'); }}
          >
            <Filter className="mr-2 h-3.5 w-3.5" /> Clear filters
          </Button>
        )}
      </div>

      {/* Topic accordion */}
      {filteredTopics.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Filter className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">No topics match your filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTopics.map((topic, idx) => {
            const solvedCount = topic.problems.filter((p) => SOLVED_SET.has(progressMap.get(p.id) || 'Not Started')).length;
            const topicPct = topic.problems.length > 0 ? Math.round((solvedCount / topic.problems.length) * 100) : 0;
            const allSolved = solvedCount === topic.problems.length && topic.problems.length > 0;
            const isOpen = openTopics.has(topic.id);
            return (
              <Collapsible
                key={topic.id}
                open={isOpen}
                onOpenChange={(o) => setOpenTopics((prev) => { const n = new Set(prev); if (o) n.add(topic.id); else n.delete(topic.id); return n; })}
              >
                <Card className={allSolved ? 'border-success/30' : ''}>
                  <CollapsibleTrigger asChild>
                    <button className="flex w-full items-center gap-4 p-4 text-left">
                      <div className={`grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg text-sm font-bold ${allSolved ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'}`}>
                        {allSolved ? <CheckCircle2 className="h-5 w-5" /> : idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{topic.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {solvedCount}/{topic.problems.length} solved · {topic.problems.length} problems
                        </p>
                      </div>
                      <div className="hidden w-32 flex-shrink-0 sm:block">
                        <div className="mb-1 text-right text-xs font-medium">{topicPct}%</div>
                        <Progress value={topicPct} className="h-1.5" />
                      </div>
                      {isOpen ? <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />}
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="border-t border-border/60 pt-4">
                      {/* Mobile progress bar */}
                      <div className="mb-3 sm:hidden">
                        <div className="mb-1 flex justify-between text-xs"><span className="text-muted-foreground">{solvedCount}/{topic.problems.length}</span><span className="font-medium">{topicPct}%</span></div>
                        <Progress value={topicPct} className="h-1.5" />
                      </div>
                      <div className="space-y-2">
                        {topic.problems.map((problem, pIdx) => {
                          const st = progressMap.get(problem.id) || 'Not Started';
                          const isBookmarked = bookmarkSet.has(problem.id);
                          const isUpdating = updatingId === problem.id;
                          const isSolved = SOLVED_SET.has(st);
                          return (
                            <div
                              key={problem.id}
                              className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${isSolved ? 'border-success/20 bg-success/5' : 'border-border/60 bg-elevated'}`}
                            >
                              {/* Status icon */}
                              <div className="flex-shrink-0">
                                {isSolved ? (
                                  <CheckCircle2 className="h-4 w-4 text-success" />
                                ) : st === 'Needs Revision' ? (
                                  <RotateCcw className="h-4 w-4 text-destructive" />
                                ) : st === 'Attempted' ? (
                                  <Circle className="h-4 w-4 text-warning fill-warning/20" />
                                ) : (
                                  <Circle className="h-4 w-4 text-muted-foreground/40" />
                                )}
                              </div>

                              {/* Problem info */}
                              <Link href={`/dsa/${problem.id}`} className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground/60">{pIdx + 1}.</span>
                                  <span className="truncate font-medium text-sm hover:text-primary">{problem.title}</span>
                                </div>
                                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                  <span className={`rounded border px-1.5 py-0 text-[10px] font-medium ${difficultyColor(problem.difficulty)}`}>
                                    {problem.difficulty}
                                  </span>
                                  {problem.leetcode_number && (
                                    <span className="text-[10px] text-muted-foreground/70">LC #{problem.leetcode_number}</span>
                                  )}
                                  {problem.algorithm && (
                                    <Badge variant="outline" className="text-[9px] py-0">{problem.algorithm}</Badge>
                                  )}
                                </div>
                              </Link>

                              {/* Bookmark */}
                              <button
                                onClick={() => toggleBookmark(problem.id)}
                                className="flex-shrink-0 text-muted-foreground hover:text-primary transition-colors"
                                aria-label="Bookmark"
                              >
                                {isBookmarked ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4" />}
                              </button>

                              {/* External link */}
                              <a
                                href={problem.problem_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-shrink-0 text-muted-foreground hover:text-primary transition-colors"
                                aria-label="Open problem"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>

                              {/* Status selector */}
                              <div className="flex-shrink-0 w-36 sm:w-44">
                                <Select
                                  value={st}
                                  onValueChange={(v) => updateStatus(problem.id, v as ProblemStatus)}
                                  disabled={isUpdating}
                                >
                                  <SelectTrigger className="h-8 text-xs">
                                    {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <SelectValue />}
                                  </SelectTrigger>
                                  <SelectContent>
                                    {STATUSES.map((s) => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      )}

      {/* Summary footer */}
      {!loading && filteredTopics.length > 0 && (
        <div className="mt-6 flex items-center justify-center gap-6 text-sm text-muted-foreground">
          <span>{filteredTopics.length} topics</span>
          <span>·</span>
          <span>{filteredTopics.reduce((acc, t) => acc + t.problems.length, 0)} problems shown</span>
        </div>
      )}
    </AppShell>
  );
}
