'use client';

import { useEffect, useState, useCallback } from 'react';
import { BookOpen, ChevronDown, ChevronRight, Plus, Edit, Loader2 } from 'lucide-react';
import { AdminGuard } from '@/components/admin-guard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import type { Roadmap, RoadmapPhase, RoadmapLesson } from '@/lib/types';

export default function AdminRoadmapsPage() {
  const { toast } = useToast();
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [phasesByRoadmap, setPhasesByRoadmap] = useState<Record<string, RoadmapPhase[]>>({});
  const [lessonsByPhase, setLessonsByPhase] = useState<Record<string, RoadmapLesson[]>>({});
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());

  // Dialog state
  const [rmDialog, setRmDialog] = useState(false);
  const [rmForm, setRmForm] = useState({ name: '', description: '', is_published: true });
  const [phaseDialog, setPhaseDialog] = useState<string | null>(null);
  const [phaseForm, setPhaseForm] = useState({ title: '', description: '', display_order: 0, is_published: true });
  const [lessonDialog, setLessonDialog] = useState<string | null>(null);
  const [lessonForm, setLessonForm] = useState({ title: '', description: '', estimated_duration: '', difficulty: 'Beginner', is_published: true, display_order: 0 });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: rms } = await supabase.from('roadmaps').select('*').order('created_at', { ascending: false });
    const rmList = (rms as Roadmap[]) || [];
    setRoadmaps(rmList);
    const pMap: Record<string, RoadmapPhase[]> = {};
    for (const r of rmList) {
      const { data: phs } = await supabase.from('roadmap_phases').select('*').eq('roadmap_id', r.id).order('display_order');
      pMap[r.id] = (phs as RoadmapPhase[]) || [];
    }
    setPhasesByRoadmap(pMap);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function loadLessons(phaseId: string) {
    const { data } = await supabase.from('roadmap_lessons').select('*').eq('phase_id', phaseId).order('display_order');
    setLessonsByPhase((prev) => ({ ...prev, [phaseId]: (data as RoadmapLesson[]) || [] }));
  }

  async function createRoadmap() {
    if (!rmForm.name.trim()) { toast({ title: 'Name required', variant: 'destructive' }); return; }
    setSaving(true);
    const { error } = await supabase.from('roadmaps').insert({
      name: rmForm.name, slug: rmForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      description: rmForm.description || null, is_published: rmForm.is_published,
    });
    setSaving(false);
    if (error) { toast({ title: 'Failed', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Roadmap created' }); setRmDialog(false); setRmForm({ name: '', description: '', is_published: true }); load();
  }

  async function createPhase(roadmapId: string) {
    if (!phaseForm.title.trim()) { toast({ title: 'Title required', variant: 'destructive' }); return; }
    setSaving(true);
    const { error } = await supabase.from('roadmap_phases').insert({
      roadmap_id: roadmapId, title: phaseForm.title, description: phaseForm.description || null,
      display_order: phaseForm.display_order, is_published: phaseForm.is_published,
    });
    setSaving(false);
    if (error) { toast({ title: 'Failed', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Phase created' }); setPhaseDialog(null); setPhaseForm({ title: '', description: '', display_order: 0, is_published: true }); load();
  }

  async function createLesson(phaseId: string) {
    if (!lessonForm.title.trim()) { toast({ title: 'Title required', variant: 'destructive' }); return; }
    setSaving(true);
    const { error } = await supabase.from('roadmap_lessons').insert({
      phase_id: phaseId, title: lessonForm.title, description: lessonForm.description || null,
      estimated_duration: lessonForm.estimated_duration || null, difficulty: lessonForm.difficulty,
      is_published: lessonForm.is_published, display_order: lessonForm.display_order,
    });
    setSaving(false);
    if (error) { toast({ title: 'Failed', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Lesson created' }); setLessonDialog(null); setLessonForm({ title: '', description: '', estimated_duration: '', difficulty: 'Beginner', is_published: true, display_order: 0 });
    loadLessons(phaseId);
  }

  async function togglePublish(table: string, id: string, current: boolean) {
    const { error } = await supabase.from(table).update({ is_published: !current }).eq('id', id);
    if (error) { toast({ title: 'Failed', variant: 'destructive' }); return; }
    load();
    Object.keys(lessonsByPhase).forEach(loadLessons);
  }

  return (
    <AdminGuard>
      <div className="mb-6 flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Roadmaps</h1><p className="mt-1 text-muted-foreground">Manage roadmaps, phases, and lessons.</p></div>
        <Button onClick={() => setRmDialog(true)}><Plus className="mr-2 h-4 w-4" /> New Roadmap</Button>
      </div>

      {loading ? <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Card key={i}><CardContent className="h-16" /></Card>)}</div> : roadmaps.length === 0 ? (
        <Card><CardContent className="py-16 text-center"><BookOpen className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><p className="text-muted-foreground">No roadmaps yet.</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {roadmaps.map((rm) => {
            const isOpen = expanded.has(rm.id);
            const phases = phasesByRoadmap[rm.id] || [];
            return (
              <Card key={rm.id}>
                <CardContent className="p-0">
                  <button
                    onClick={() => setExpanded((prev) => { const n = new Set(prev); if (isOpen) n.delete(rm.id); else n.add(rm.id); return n; })}
                    className="flex w-full items-center gap-3 p-4 text-left"
                  >
                    {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{rm.name}</h3>
                        {rm.is_published ? <Badge variant="outline" className="text-success border-success/20">Published</Badge> : <Badge variant="outline">Draft</Badge>}
                      </div>
                      {rm.description && <p className="mt-0.5 text-xs text-muted-foreground">{rm.description}</p>}
                    </div>
                    <span className="text-xs text-muted-foreground">{phases.length} phases</span>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); togglePublish('roadmaps', rm.id, rm.is_published); }}>{rm.is_published ? 'Unpublish' : 'Publish'}</Button>
                  </button>

                  {isOpen && (
                    <div className="border-t border-border/60 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium">Phases</span>
                        <Button size="sm" variant="outline" onClick={() => setPhaseDialog(rm.id)}><Plus className="mr-1 h-3 w-3" /> Add Phase</Button>
                      </div>
                      <div className="space-y-2">
                        {phases.map((ph) => {
                          const phOpen = expandedPhases.has(ph.id);
                          return (
                            <div key={ph.id} className="rounded-lg border border-border/60 bg-elevated">
                              <button
                                onClick={async () => {
                                  setExpandedPhases((prev) => { const n = new Set(prev); if (phOpen) n.delete(ph.id); else n.add(ph.id); return n; });
                                  if (!phOpen) await loadLessons(ph.id);
                                }}
                                className="flex w-full items-center gap-2 p-3 text-left"
                              >
                                {phOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                                <span className="flex-1 text-sm font-medium">{ph.title}</span>
                                {ph.is_published ? <Badge variant="outline" className="text-success border-success/20 text-[10px]">Published</Badge> : <Badge variant="outline" className="text-[10px]">Draft</Badge>}
                                <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); togglePublish('roadmap_phases', ph.id, ph.is_published); }}>{ph.is_published ? 'Unpublish' : 'Publish'}</Button>
                              </button>
                              {phOpen && (
                                <div className="border-t border-border/40 p-3">
                                  <div className="mb-2 flex items-center justify-between">
                                    <span className="text-xs font-medium">Lessons</span>
                                    <Button size="sm" variant="outline" onClick={() => setLessonDialog(ph.id)}><Plus className="mr-1 h-3 w-3" /> Add Lesson</Button>
                                  </div>
                                  <div className="space-y-1">
                                    {(lessonsByPhase[ph.id] || []).map((ls) => (
                                      <div key={ls.id} className="flex items-center gap-2 rounded border border-border/40 bg-background p-2">
                                        <span className="flex-1 text-sm">{ls.title}</span>
                                        <Badge variant="outline" className="text-[10px]">{ls.difficulty}</Badge>
                                        {ls.is_published ? <Badge variant="outline" className="text-success border-success/20 text-[10px]">Published</Badge> : <Badge variant="outline" className="text-[10px]">Draft</Badge>}
                                        <Button size="sm" variant="ghost" onClick={() => togglePublish('roadmap_lessons', ls.id, ls.is_published)}>{ls.is_published ? 'Unpublish' : 'Publish'}</Button>
                                      </div>
                                    ))}
                                    {(!lessonsByPhase[ph.id] || lessonsByPhase[ph.id].length === 0) && <p className="py-2 text-center text-xs text-muted-foreground">No lessons yet.</p>}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {phases.length === 0 && <p className="py-2 text-center text-sm text-muted-foreground">No phases yet.</p>}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Roadmap dialog */}
      <Dialog open={rmDialog} onOpenChange={setRmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Roadmap</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Name</Label><Input value={rmForm.name} onChange={(e) => setRmForm({ ...rmForm, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={rmForm.description} onChange={(e) => setRmForm({ ...rmForm, description: e.target.value })} rows={2} /></div>
            <div className="flex items-center gap-2"><input type="checkbox" id="rm_pub" checked={rmForm.is_published} onChange={(e) => setRmForm({ ...rmForm, is_published: e.target.checked })} className="h-4 w-4 rounded" /><Label htmlFor="rm_pub">Published</Label></div>
            <Button onClick={createRoadmap} disabled={saving} className="w-full">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Create</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Phase dialog */}
      <Dialog open={!!phaseDialog} onOpenChange={(o) => { if (!o) setPhaseDialog(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Phase</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Title</Label><Input value={phaseForm.title} onChange={(e) => setPhaseForm({ ...phaseForm, title: e.target.value })} /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={phaseForm.description} onChange={(e) => setPhaseForm({ ...phaseForm, description: e.target.value })} rows={2} /></div>
            <div className="space-y-2"><Label>Display order</Label><Input type="number" value={phaseForm.display_order} onChange={(e) => setPhaseForm({ ...phaseForm, display_order: Number(e.target.value) })} /></div>
            <div className="flex items-center gap-2"><input type="checkbox" id="ph_pub" checked={phaseForm.is_published} onChange={(e) => setPhaseForm({ ...phaseForm, is_published: e.target.checked })} className="h-4 w-4 rounded" /><Label htmlFor="ph_pub">Published</Label></div>
            <Button onClick={() => phaseDialog && createPhase(phaseDialog)} disabled={saving} className="w-full">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Create</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lesson dialog */}
      <Dialog open={!!lessonDialog} onOpenChange={(o) => { if (!o) setLessonDialog(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Lesson</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Title</Label><Input value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={lessonForm.description} onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })} rows={2} /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Duration</Label><Input value={lessonForm.estimated_duration} onChange={(e) => setLessonForm({ ...lessonForm, estimated_duration: e.target.value })} placeholder="1-2 hours" /></div>
              <div className="space-y-2"><Label>Difficulty</Label><Select value={lessonForm.difficulty} onValueChange={(v) => setLessonForm({ ...lessonForm, difficulty: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['Beginner','Intermediate','Advanced'].map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="flex items-center gap-2"><input type="checkbox" id="ls_pub" checked={lessonForm.is_published} onChange={(e) => setLessonForm({ ...lessonForm, is_published: e.target.checked })} className="h-4 w-4 rounded" /><Label htmlFor="ls_pub">Published</Label></div>
            <Button onClick={() => lessonDialog && createLesson(lessonDialog)} disabled={saving} className="w-full">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Create</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminGuard>
  );
}
