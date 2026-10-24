'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Bookmark, BookmarkCheck, ExternalLink, Lightbulb, PlayCircle, FileText, StickyNote, Loader2 } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { difficultyColor, statusColor } from '@/lib/format';
import type { DsaProblem, ProblemStatus } from '@/lib/types';

const STATUSES: ProblemStatus[] = ['Not Started', 'Attempted', 'Solved with Hints', 'Solved Independently', 'Needs Revision'];

export default function ProblemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [problem, setProblem] = useState<DsaProblem | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<ProblemStatus>('Not Started');
  const [bookmarked, setBookmarked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('dsa_problems')
        .select('*, topic:dsa_topics(*)')
        .eq('id', id)
        .maybeSingle();
      if (error || !data) {
        setLoading(false);
        return;
      }
      setProblem(data as DsaProblem);
      setLoading(false);
    })();
  }, [id]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [pRes, bRes] = await Promise.all([
        supabase.from('user_problem_progress').select('*').eq('user_id', user.id).eq('problem_id', id).maybeSingle(),
        supabase.from('problem_bookmarks').select('*').eq('user_id', user.id).eq('problem_id', id).maybeSingle(),
      ]);
      if (pRes.data) {
        setStatus(pRes.data.status as ProblemStatus);
        setNotes(pRes.data.notes || '');
      }
      setBookmarked(!!bRes.data);
    })();
  }, [user, id]);

  async function updateStatus(newStatus: ProblemStatus) {
    if (!user) return;
    setSaving(true);
    setStatus(newStatus);
    const { error } = await supabase
      .from('user_problem_progress')
      .upsert({ user_id: user.id, problem_id: id, status: newStatus }, { onConflict: 'user_id,problem_id' });
    setSaving(false);
    if (error) {
      toast({ title: 'Failed to save', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Progress updated', description: `Status: ${newStatus}` });
  }

  async function toggleBookmark() {
    if (!user) return;
    const next = !bookmarked;
    setBookmarked(next);
    if (next) {
      await supabase.from('problem_bookmarks').insert({ user_id: user.id, problem_id: id });
    } else {
      await supabase.from('problem_bookmarks').delete().eq('user_id', user.id).eq('problem_id', id);
    }
  }

  async function saveNotes() {
    if (!user) return;
    setNotesSaving(true);
    const { error } = await supabase
      .from('user_problem_progress')
      .upsert({ user_id: user.id, problem_id: id, status, notes: notes || null }, { onConflict: 'user_id,problem_id' });
    setNotesSaving(false);
    if (error) {
      toast({ title: 'Failed to save notes', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Notes saved' });
  }

  if (loading) {
    return (
      <AppShell>
        <Skeleton className="h-8 w-24" />
        <Skeleton className="mt-4 h-48 w-full" />
      </AppShell>
    );
  }

  if (!problem) {
    return (
      <AppShell>
        <div className="py-20 text-center">
          <p className="text-muted-foreground">Problem not found.</p>
          <Button asChild className="mt-4"><Link href="/dsa">Back to DSA Tracker</Link></Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Link href="/dsa" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to problems
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">{problem.title}</h1>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className={`rounded-md border px-2.5 py-0.5 text-xs font-medium ${difficultyColor(problem.difficulty)}`}>{problem.difficulty}</span>
                    {problem.topic && <Badge variant="outline">{problem.topic.name}</Badge>}
                    {problem.subtopic && <span className="text-xs text-muted-foreground">{problem.subtopic}</span>}
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={toggleBookmark}>
                  {bookmarked ? <BookmarkCheck className="h-5 w-5 text-primary" /> : <Bookmark className="h-5 w-5" />}
                </Button>
              </div>

              {problem.description && (
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{problem.description}</p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild>
                  <a href={problem.problem_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" /> Open Problem
                  </a>
                </Button>
                {problem.youtube_url && (
                  <Button variant="outline" asChild>
                    <a href={problem.youtube_url} target="_blank" rel="noopener noreferrer">
                      <PlayCircle className="mr-2 h-4 w-4" /> YouTube
                    </a>
                  </Button>
                )}
                {problem.editorial_url && (
                  <Button variant="outline" asChild>
                    <a href={problem.editorial_url} target="_blank" rel="noopener noreferrer">
                      <FileText className="mr-2 h-4 w-4" /> Editorial
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Hints */}
          {problem.hints.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><Lightbulb className="h-5 w-5 text-warning" /> Hints</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {problem.hints.map((hint, i) => (
                  <div key={i} className="rounded-lg border border-border/60 bg-elevated p-3 text-sm">
                    <span className="font-medium text-warning">Hint {i + 1}:</span> {hint}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Code solution */}
          {problem.code_solution && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Code Solution</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto rounded-lg border border-border/60 bg-background p-4 text-sm"><code>{problem.code_solution}</code></pre>
              </CardContent>
            </Card>
          )}

          {/* Tags */}
          {problem.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {problem.tags.map((tag) => <Badge key={tag} variant="outline">{tag}</Badge>)}
            </div>
          )}
        </div>

        {/* Sidebar: Status tracker */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Status</label>
                <Select value={status} onValueChange={(v) => updateStatus(v as ProblemStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className={`mt-3 rounded-md border px-3 py-2 text-center text-sm font-medium ${statusColor(status)}`}>{status}</div>
              </div>
              <Button variant="outline" className="w-full" onClick={toggleBookmark}>
                {bookmarked ? <BookmarkCheck className="mr-2 h-4 w-4 text-primary" /> : <Bookmark className="mr-2 h-4 w-4" />}
                {bookmarked ? 'Bookmarked' : 'Bookmark'}
              </Button>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><StickyNote className="h-5 w-5 text-accent" /> My Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="Write your approach, key insights, or things to remember..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={5}
                className="resize-y"
              />
              <Button variant="outline" size="sm" className="w-full" onClick={saveNotes} disabled={notesSaving}>
                {notesSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Notes
              </Button>
            </CardContent>
          </Card>

          {problem.prerequisites.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-lg">Prerequisites</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {problem.prerequisites.map((p, i) => (
                  <div key={i} className="rounded-lg border border-border/60 bg-elevated p-2 text-sm text-muted-foreground">{p}</div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}
