'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Circle, Clock, PlayCircle, FileText, ChevronDown, ChevronRight, Wrench, Rocket } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { lessonStatusColor } from '@/lib/format';
import type { Roadmap, RoadmapPhase, RoadmapLesson, UserLessonProgress, LessonStatus } from '@/lib/types';

const LESSON_STATUSES: LessonStatus[] = ['Not Started', 'Learning', 'Practicing', 'Completed'];

export default function RoadmapDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [phases, setPhases] = useState<RoadmapPhase[]>([]);
  const [lessonsByPhase, setLessonsByPhase] = useState<Record<string, RoadmapLesson[]>>({});
  const [progress, setProgress] = useState<UserLessonProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [openPhases, setOpenPhases] = useState<Set<string>>(new Set());

  // Resume learning: find first lesson that's not Completed, auto-open its phase
  useEffect(() => {
    if (!loading && allLessons.length > 0 && openPhases.size === 0) {
      const nextLesson = allLessons.find((l) => progressMap.get(l.id) !== 'Completed');
      if (nextLesson) {
        const phaseOfLesson = phases.find((ph) => lessonsByPhase[ph.id]?.some((l) => l.id === nextLesson.id));
        if (phaseOfLesson) {
          setOpenPhases(new Set([phaseOfLesson.id]));
        }
      }
    }
  }, [loading]);

  useEffect(() => {
    (async () => {
      const [rRes, pRes] = await Promise.all([
        supabase.from('roadmaps').select('*').eq('id', id).maybeSingle(),
        supabase.from('roadmap_phases').select('*').eq('roadmap_id', id).eq('is_published', true).order('display_order'),
      ]);
      setRoadmap(rRes.data as Roadmap | null);
      const phs = (pRes.data as RoadmapPhase[]) || [];
      setPhases(phs);
      const lessonMap: Record<string, RoadmapLesson[]> = {};
      await Promise.all(
        phs.map(async (ph) => {
          const { data: ls } = await supabase.from('roadmap_lessons').select('*').eq('phase_id', ph.id).eq('is_published', true).order('display_order');
          lessonMap[ph.id] = (ls as RoadmapLesson[]) || [];
        })
      );
      setLessonsByPhase(lessonMap);
      setLoading(false);
    })();
  }, [id]);

  useEffect(() => {
    if (!user) return;
    supabase.from('user_lesson_progress').select('*').eq('user_id', user.id).then(({ data }) => {
      setProgress((data as UserLessonProgress[]) || []);
    });
  }, [user]);

  const progressMap = new Map(progress.map((p) => [p.lesson_id, p.status]));
  const allLessons = Object.values(lessonsByPhase).flat();
  const completedCount = allLessons.filter((l) => progressMap.get(l.id) === 'Completed').length;
  const overallPct = allLessons.length > 0 ? Math.round((completedCount / allLessons.length) * 100) : 0;

  const updateLessonStatus = useCallback(async (lessonId: string, newStatus: LessonStatus) => {
    if (!user) return;
    setProgress((prev) => {
      const existing = prev.find((p) => p.lesson_id === lessonId);
      if (existing) return prev.map((p) => (p.lesson_id === lessonId ? { ...p, status: newStatus } : p));
      return [...prev, { id: '', user_id: user.id, lesson_id: lessonId, status: newStatus, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }];
    });
    const { error } = await supabase
      .from('user_lesson_progress')
      .upsert({ user_id: user.id, lesson_id: lessonId, status: newStatus }, { onConflict: 'user_id,lesson_id' });
    if (error) {
      toast({ title: 'Failed to save', description: error.message, variant: 'destructive' });
    }
  }, [user, toast]);

  if (loading) {
    return <AppShell><Skeleton className="h-8 w-24" /><Skeleton className="mt-4 h-64 w-full" /></AppShell>;
  }

  if (!roadmap) {
    return <AppShell><div className="py-20 text-center"><p className="text-muted-foreground">Roadmap not found.</p><Button asChild className="mt-4"><Link href="/roadmaps">Back</Link></Button></div></AppShell>;
  }

  return (
    <AppShell>
      <Link href="/roadmaps" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All roadmaps
      </Link>

      <div className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{roadmap.name}</h1>
            {roadmap.description && <p className="mt-1 text-muted-foreground">{roadmap.description}</p>}
          </div>
          {overallPct < 100 && allLessons.length > 0 && (() => {
            const nextLesson = allLessons.find((l) => progressMap.get(l.id) !== 'Completed');
            const nextPhase = nextLesson ? phases.find((ph) => lessonsByPhase[ph.id]?.some((l) => l.id === nextLesson.id)) : null;
            return nextPhase ? (
              <Button
                variant="outline"
                size="sm"
                className="flex-shrink-0"
                onClick={() => setOpenPhases((prev) => { const n = new Set(prev); n.add(nextPhase.id); return n; })}
              >
                <Rocket className="mr-2 h-4 w-4" /> Resume Learning
              </Button>
            ) : null;
          })()}
        </div>
        <div className="mt-4 max-w-md">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{completedCount} of {allLessons.length} lessons complete</span>
            <span className="font-medium">{overallPct}%</span>
          </div>
          <Progress value={overallPct} className="h-2" />
        </div>
      </div>

      <div className="space-y-3">
        {phases.map((phase, idx) => {
          const phaseLessons = lessonsByPhase[phase.id] || [];
          const phaseCompleted = phaseLessons.filter((l) => progressMap.get(l.id) === 'Completed').length;
          const phasePct = phaseLessons.length > 0 ? Math.round((phaseCompleted / phaseLessons.length) * 100) : 0;
          const isOpen = openPhases.has(phase.id);
          return (
            <Collapsible key={phase.id} open={isOpen} onOpenChange={(o) => setOpenPhases((prev) => { const n = new Set(prev); if (o) n.add(phase.id); else n.delete(phase.id); return n; })}>
              <Card>
                <CollapsibleTrigger asChild>
                  <button className="flex w-full items-center gap-4 p-4 text-left">
                    <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg bg-primary/10 text-sm font-bold text-primary">{idx + 1}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{phase.title}</h3>
                      {phase.description && <p className="text-xs text-muted-foreground">{phase.description}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{phaseCompleted}/{phaseLessons.length}</span>
                      {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="border-t border-border/60 pt-4">
                    <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${phasePct}%` }} />
                    </div>
                    <div className="space-y-2">
                      {phaseLessons.length === 0 ? (
                        <p className="py-4 text-center text-sm text-muted-foreground">Lessons coming soon.</p>
                      ) : phaseLessons.map((lesson) => {
                        const st = progressMap.get(lesson.id) || 'Not Started';
                        return (
                          <div key={lesson.id} className="rounded-lg border border-border/60 bg-elevated p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  {st === 'Completed' ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                                  <h4 className="font-medium">{lesson.title}</h4>
                                </div>
                                {lesson.description && <p className="mt-1 text-sm text-muted-foreground">{lesson.description}</p>}
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                  {lesson.estimated_duration && (
                                    <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" /> {lesson.estimated_duration}</span>
                                  )}
                                  <Badge variant="outline" className="text-[10px]">{lesson.difficulty}</Badge>
                                  {lesson.youtube_url && (
                                    <a href={lesson.youtube_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
                                      <PlayCircle className="h-3 w-3" /> YouTube
                                    </a>
                                  )}
                                  {lesson.doc_url && (
                                    <a href={lesson.doc_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
                                      <FileText className="h-3 w-3" /> Docs
                                    </a>
                                  )}
                                </div>
                                {lesson.objectives.length > 0 && (
                                  <ul className="mt-2 space-y-1">
                                    {lesson.objectives.map((obj, i) => (
                                      <li key={i} className="text-xs text-muted-foreground">• {obj}</li>
                                    ))}
                                  </ul>
                                )}
                                {lesson.mini_project && (
                                  <div className="mt-3 flex items-start gap-2 rounded-md border border-accent/20 bg-accent/5 p-3">
                                    <Wrench className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-accent" />
                                    <div>
                                      <p className="text-xs font-medium text-accent">Practical Project</p>
                                      <p className="text-xs text-muted-foreground">{lesson.mini_project}</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="w-40 flex-shrink-0">
                                <Select value={st} onValueChange={(v) => updateLessonStatus(lesson.id, v as LessonStatus)}>
                                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {LESSON_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                                <div className={`mt-1.5 rounded border px-2 py-0.5 text-center text-[10px] font-medium ${lessonStatusColor(st)}`}>{st}</div>
                              </div>
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
    </AppShell>
  );
}
