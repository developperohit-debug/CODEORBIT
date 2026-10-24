'use client';

import { useEffect, useState, useCallback } from 'react';
import { Code2, Edit, Plus, Trash2, Loader2 } from 'lucide-react';
import { AdminGuard } from '@/components/admin-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { difficultyColor } from '@/lib/format';
import type { DsaProblem, DsaTopic, Difficulty } from '@/lib/types';

export default function AdminProblemsPage() {
  const { toast } = useToast();
  const [problems, setProblems] = useState<DsaProblem[]>([]);
  const [topics, setTopics] = useState<DsaTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DsaProblem | null>(null);
  const [form, setForm] = useState({
    title: '', description: '', problem_url: '', difficulty: 'Easy' as Difficulty, topic_id: '', subtopic: '',
    hints: '', youtube_url: '', editorial_url: '', code_solution: '', tags: '', is_published: false,
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [pRes, tRes] = await Promise.all([
      supabase.from('dsa_problems').select('*, topic:dsa_topics(*)').order('created_at', { ascending: false }),
      supabase.from('dsa_topics').select('*').order('display_order'),
    ]);
    setProblems((pRes.data as DsaProblem[]) || []);
    setTopics((tRes.data as DsaTopic[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openNew() {
    setEditing(null);
    setForm({ title: '', description: '', problem_url: '', difficulty: 'Easy', topic_id: '', subtopic: '', hints: '', youtube_url: '', editorial_url: '', code_solution: '', tags: '', is_published: false });
    setDialogOpen(true);
  }

  function openEdit(p: DsaProblem) {
    setEditing(p);
    setForm({
      title: p.title, description: p.description || '', problem_url: p.problem_url, difficulty: p.difficulty,
      topic_id: p.topic_id || '', subtopic: p.subtopic || '', hints: p.hints.join(', '),
      youtube_url: p.youtube_url || '', editorial_url: p.editorial_url || '', code_solution: p.code_solution || '',
      tags: p.tags.join(', '), is_published: p.is_published,
    });
    setDialogOpen(true);
  }

  async function save() {
    if (!form.title.trim() || !form.problem_url.trim()) {
      toast({ title: 'Title and problem URL are required', variant: 'destructive' }); return;
    }
    setSaving(true);
    const payload = {
      title: form.title,
      description: form.description || null,
      problem_url: form.problem_url,
      difficulty: form.difficulty,
      topic_id: form.topic_id || null,
      subtopic: form.subtopic || null,
      hints: form.hints.split(',').map((s) => s.trim()).filter(Boolean),
      youtube_url: form.youtube_url || null,
      editorial_url: form.editorial_url || null,
      code_solution: form.code_solution || null,
      tags: form.tags.split(',').map((s) => s.trim()).filter(Boolean),
      is_published: form.is_published,
    };
    if (editing) {
      const { error } = await supabase.from('dsa_problems').update(payload).eq('id', editing.id);
      if (error) { toast({ title: 'Update failed', description: error.message, variant: 'destructive' }); setSaving(false); return; }
      toast({ title: 'Problem updated' });
    } else {
      const { error } = await supabase.from('dsa_problems').insert(payload);
      if (error) { toast({ title: 'Create failed', description: error.message, variant: 'destructive' }); setSaving(false); return; }
      toast({ title: 'Problem created' });
    }
    setSaving(false);
    setDialogOpen(false);
    load();
  }

  async function togglePublish(p: DsaProblem) {
    const { error } = await supabase.from('dsa_problems').update({ is_published: !p.is_published }).eq('id', p.id);
    if (error) { toast({ title: 'Failed', variant: 'destructive' }); return; }
    toast({ title: p.is_published ? 'Unpublished' : 'Published' });
    load();
  }

  async function deleteProblem(p: DsaProblem) {
    const { error } = await supabase.from('dsa_problems').delete().eq('id', p.id);
    if (error) { toast({ title: 'Failed to delete', variant: 'destructive' }); return; }
    toast({ title: 'Problem deleted' });
    load();
  }

  return (
    <AdminGuard>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">DSA Problems</h1>
          <p className="mt-1 text-muted-foreground">Create, edit, and publish problems.</p>
        </div>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> New Problem</Button>
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Card key={i}><CardContent className="h-16" /></Card>)}</div>
      ) : problems.length === 0 ? (
        <Card><CardContent className="py-16 text-center"><Code2 className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><p className="text-muted-foreground">No problems yet.</p></CardContent></Card>
      ) : (
        <div className="space-y-2">
          {problems.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{p.title}</h3>
                    <span className={`rounded-md border px-2 py-0.5 text-xs font-medium ${difficultyColor(p.difficulty)}`}>{p.difficulty}</span>
                    {p.is_published ? <Badge variant="outline" className="text-success border-success/20">Published</Badge> : <Badge variant="outline">Draft</Badge>}
                  </div>
                  {p.topic && <p className="mt-1 text-xs text-muted-foreground">{p.topic.name}</p>}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => togglePublish(p)}>{p.is_published ? 'Unpublish' : 'Publish'}</Button>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteProblem(p)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit Problem' : 'New Problem'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="space-y-2"><Label>Problem URL</Label><Input value={form.problem_url} onChange={(e) => setForm({ ...form, problem_url: e.target.value })} placeholder="https://leetcode.com/problems/..." /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select value={form.difficulty} onValueChange={(v) => setForm({ ...form, difficulty: v as Difficulty })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{['Easy','Medium','Hard'].map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Topic</Label>
                <Select value={form.topic_id} onValueChange={(v) => setForm({ ...form, topic_id: v })}>
                  <SelectTrigger><SelectValue placeholder="No topic" /></SelectTrigger>
                  <SelectContent>{topics.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Subtopic</Label><Input value={form.subtopic} onChange={(e) => setForm({ ...form, subtopic: e.target.value })} /></div>
              <div className="space-y-2"><Label>Hints (comma-separated)</Label><Input value={form.hints} onChange={(e) => setForm({ ...form, hints: e.target.value })} /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>YouTube URL</Label><Input value={form.youtube_url} onChange={(e) => setForm({ ...form, youtube_url: e.target.value })} /></div>
              <div className="space-y-2"><Label>Editorial URL</Label><Input value={form.editorial_url} onChange={(e) => setForm({ ...form, editorial_url: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Tags (comma-separated)</Label><Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} /></div>
            <div className="space-y-2"><Label>Code Solution</Label><Textarea value={form.code_solution} onChange={(e) => setForm({ ...form, code_solution: e.target.value })} rows={4} className="font-mono text-xs" /></div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="is_published" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} className="h-4 w-4 rounded" />
              <Label htmlFor="is_published">Published</Label>
            </div>
            <Button onClick={save} disabled={saving} className="w-full">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{editing ? 'Update' : 'Create'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminGuard>
  );
}
