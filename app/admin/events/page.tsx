'use client';

import { useEffect, useState, useCallback } from 'react';
import { Calendar, Edit, Plus, Trash2, Loader2 } from 'lucide-react';
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
import { formatDate, eventStatusColor, computeEventStatus } from '@/lib/format';
import type { Event, EventCategory, EventStatus } from '@/lib/types';

export default function AdminEventsPage() {
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Event | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', organizer: '', description: '', category: 'Coding Contest' as EventCategory,
    start_date: '', end_date: '', registration_deadline: '', timezone: 'IST',
    format: 'Online', eligibility: '', prize_details: '', registration_url: '', event_url: '',
    status: 'Upcoming' as EventStatus, is_published: false,
  });

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('events').select('*').order('start_date', { ascending: false });
    setEvents((data as Event[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openNew() {
    setEditing(null);
    setForm({ title: '', organizer: '', description: '', category: 'Coding Contest', start_date: '', end_date: '', registration_deadline: '', timezone: 'IST', format: 'Online', eligibility: '', prize_details: '', registration_url: '', event_url: '', status: 'Upcoming', is_published: false });
    setDialogOpen(true);
  }

  function openEdit(e: Event) {
    setEditing(e);
    setForm({
      title: e.title, organizer: e.organizer || '', description: e.description || '', category: e.category,
      start_date: e.start_date.slice(0, 16), end_date: e.end_date?.slice(0, 16) || '', registration_deadline: e.registration_deadline?.slice(0, 16) || '',
      timezone: e.timezone || 'IST', format: e.format || 'Online', eligibility: e.eligibility || '', prize_details: e.prize_details || '',
      registration_url: e.registration_url || '', event_url: e.event_url || '', status: e.status, is_published: e.is_published,
    });
    setDialogOpen(true);
  }

  async function save() {
    if (!form.title.trim() || !form.start_date) { toast({ title: 'Title and start date required', variant: 'destructive' }); return; }
    setSaving(true);
    const payload = {
      title: form.title, organizer: form.organizer || null, description: form.description || null, category: form.category,
      start_date: form.start_date, end_date: form.end_date || null, registration_deadline: form.registration_deadline || null,
      timezone: form.timezone, format: form.format, eligibility: form.eligibility || null, prize_details: form.prize_details || null,
      registration_url: form.registration_url || null, event_url: form.event_url || null, status: form.status, is_published: form.is_published,
    };
    if (editing) {
      const { error } = await supabase.from('events').update(payload).eq('id', editing.id);
      if (error) { toast({ title: 'Update failed', description: error.message, variant: 'destructive' }); setSaving(false); return; }
      toast({ title: 'Event updated' });
    } else {
      const { error } = await supabase.from('events').insert(payload);
      if (error) { toast({ title: 'Create failed', description: error.message, variant: 'destructive' }); setSaving(false); return; }
      toast({ title: 'Event created' });
    }
    setSaving(false); setDialogOpen(false); load();
  }

  async function deleteEvent(e: Event) {
    const { error } = await supabase.from('events').delete().eq('id', e.id);
    if (error) { toast({ title: 'Failed', variant: 'destructive' }); return; }
    toast({ title: 'Event deleted' }); load();
  }

  return (
    <AdminGuard>
      <div className="mb-6 flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Events</h1><p className="mt-1 text-muted-foreground">Manage contests and hackathons.</p></div>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> New Event</Button>
      </div>

      {loading ? <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Card key={i}><CardContent className="h-16" /></Card>)}</div> : events.length === 0 ? (
        <Card><CardContent className="py-16 text-center"><Calendar className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><p className="text-muted-foreground">No events yet.</p></CardContent></Card>
      ) : (
        <div className="space-y-2">
          {events.map((e) => {
            const cs = computeEventStatus(e.start_date, e.end_date, e.status);
            return (
              <Card key={e.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{e.title}</h3>
                      <Badge variant="outline" className="text-[10px]">{e.category}</Badge>
                      <span className={`rounded-md border px-2 py-0.5 text-xs font-medium ${eventStatusColor(cs)}`}>{cs}</span>
                      {e.is_published ? <Badge variant="outline" className="text-success border-success/20">Published</Badge> : <Badge variant="outline">Draft</Badge>}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{formatDate(e.start_date)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(e)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteEvent(e)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit Event' : 'New Event'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Organizer</Label><Input value={form.organizer} onChange={(e) => setForm({ ...form, organizer: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as EventCategory })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Coding Contest">Coding Contest</SelectItem><SelectItem value="Hackathon">Hackathon</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Start date & time</Label><Input type="datetime-local" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
              <div className="space-y-2"><Label>End date & time</Label><Input type="datetime-local" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Registration deadline</Label><Input type="datetime-local" value={form.registration_deadline} onChange={(e) => setForm({ ...form, registration_deadline: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>Format</Label>
                <Select value={form.format} onValueChange={(v) => setForm({ ...form, format: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{['Online','Offline','Hybrid'].map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
            <div className="space-y-2"><Label>Eligibility</Label><Input value={form.eligibility} onChange={(e) => setForm({ ...form, eligibility: e.target.value })} /></div>
            <div className="space-y-2"><Label>Prize details</Label><Input value={form.prize_details} onChange={(e) => setForm({ ...form, prize_details: e.target.value })} /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Registration URL</Label><Input value={form.registration_url} onChange={(e) => setForm({ ...form, registration_url: e.target.value })} /></div>
              <div className="space-y-2"><Label>Event URL</Label><Input value={form.event_url} onChange={(e) => setForm({ ...form, event_url: e.target.value })} /></div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="ev_published" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} className="h-4 w-4 rounded" />
              <Label htmlFor="ev_published">Published</Label>
            </div>
            <Button onClick={save} disabled={saving} className="w-full">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{editing ? 'Update' : 'Create'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminGuard>
  );
}
