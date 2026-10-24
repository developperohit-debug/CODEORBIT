'use client';

import { useEffect, useState, useCallback } from 'react';
import { Megaphone, Plus, Edit, Trash2, Loader2 } from 'lucide-react';
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
import { timeAgo } from '@/lib/format';
import type { Announcement } from '@/lib/types';

export default function AdminAnnouncementsPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [form, setForm] = useState({ title: '', content: '', status: 'Draft' as 'Draft' | 'Published' | 'Archived' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    setItems((data as Announcement[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openNew() { setEditing(null); setForm({ title: '', content: '', status: 'Draft' }); setDialogOpen(true); }
  function openEdit(a: Announcement) { setEditing(a); setForm({ title: a.title, content: a.content, status: a.status }); setDialogOpen(true); }

  async function save() {
    if (!form.title.trim() || !form.content.trim()) { toast({ title: 'Title and content required', variant: 'destructive' }); return; }
    setSaving(true);
    if (editing) {
      const { error } = await supabase.from('announcements').update(form).eq('id', editing.id);
      if (error) { toast({ title: 'Update failed', description: error.message, variant: 'destructive' }); setSaving(false); return; }
      toast({ title: 'Announcement updated' });
    } else {
      const { error } = await supabase.from('announcements').insert(form);
      if (error) { toast({ title: 'Create failed', description: error.message, variant: 'destructive' }); setSaving(false); return; }
      toast({ title: 'Announcement created' });
    }
    setSaving(false); setDialogOpen(false); load();
  }

  async function del(a: Announcement) {
    const { error } = await supabase.from('announcements').delete().eq('id', a.id);
    if (error) { toast({ title: 'Failed', variant: 'destructive' }); return; }
    toast({ title: 'Deleted' }); load();
  }

  return (
    <AdminGuard>
      <div className="mb-6 flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Announcements</h1><p className="mt-1 text-muted-foreground">Publish platform-wide announcements.</p></div>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> New Announcement</Button>
      </div>

      {loading ? <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Card key={i}><CardContent className="h-16" /></Card>)}</div> : items.length === 0 ? (
        <Card><CardContent className="py-16 text-center"><Megaphone className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><p className="text-muted-foreground">No announcements yet.</p></CardContent></Card>
      ) : (
        <div className="space-y-2">
          {items.map((a) => (
            <Card key={a.id}>
              <CardContent className="flex items-start justify-between p-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{a.title}</h3>
                    <Badge variant="outline" className={a.status === 'Published' ? 'text-success border-success/20' : ''}>{a.status}</Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{a.content}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{timeAgo(a.created_at)}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(a)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => del(a)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Edit Announcement' : 'New Announcement'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="space-y-2"><Label>Content</Label><Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={4} /></div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['Draft','Published','Archived'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button onClick={save} disabled={saving} className="w-full">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{editing ? 'Update' : 'Create'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminGuard>
  );
}
