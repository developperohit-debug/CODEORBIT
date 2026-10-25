'use client';

import { useEffect, useState, useCallback } from 'react';
import { Lightbulb, Loader2, MessageSquare, Eye, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { AdminGuard } from '@/components/admin-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { timeAgo } from '@/lib/format';

interface AdminSuggestion {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  admin_response: string | null;
  responded_by: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  profiles: { full_name: string; username: string | null; email: string } | null;
}

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open', icon: Clock },
  { value: 'under_review', label: 'Under Review', icon: Eye },
  { value: 'planned', label: 'Planned', icon: CheckCircle2 },
  { value: 'implemented', label: 'Implemented', icon: CheckCircle2 },
  { value: 'declined', label: 'Declined', icon: XCircle },
];

const CATEGORIES: Record<string, string> = {
  feature: 'Feature Request',
  bug: 'Bug Report',
  ui: 'UI/UX',
  content: 'Content',
  other: 'Other',
};

export default function AdminSuggestionsPage() {
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<AdminSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [newStatus, setNewStatus] = useState('open');
  const [saving, setSaving] = useState(false);

  const loadSuggestions = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from('user_suggestions')
      .select('*, profiles!user_suggestions_user_id_fkey(full_name, username, email)')
      .order('created_at', { ascending: false });
    if (statusFilter !== 'all') q = q.eq('status', statusFilter);
    if (search) q = q.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    const { data, error } = await q;
    if (error) {
      toast({ title: 'Failed to load suggestions', description: error.message, variant: 'destructive' });
    } else {
      setSuggestions((data as AdminSuggestion[]) || []);
    }
    setLoading(false);
  }, [statusFilter, search, toast]);

  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  async function respondToSuggestion(id: string) {
    if (!responseText.trim()) return;
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('user_suggestions')
      .update({
        admin_response: responseText.trim(),
        status: newStatus,
        responded_by: userData.user?.id || null,
        responded_at: new Date().toISOString(),
      })
      .eq('id', id);
    setSaving(false);
    if (error) {
      toast({ title: 'Failed to respond', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Response sent' });
    setRespondingId(null);
    setResponseText('');
    setNewStatus('open');
    loadSuggestions();
  }

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from('user_suggestions').update({ status }).eq('id', id);
    if (error) {
      toast({ title: 'Failed to update', description: error.message, variant: 'destructive' });
      return;
    }
    setSuggestions((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
    toast({ title: 'Status updated' });
  }

  const statusColor = (status: string): string => {
    switch (status) {
      case 'open': return 'text-muted-foreground bg-muted/40 border-border';
      case 'under_review': return 'text-accent bg-accent/10 border-accent/20';
      case 'planned': return 'text-primary bg-primary/10 border-primary/20';
      case 'implemented': return 'text-success bg-success/10 border-success/20';
      case 'declined': return 'text-destructive bg-destructive/10 border-destructive/20';
      default: return '';
    }
  };

  return (
    <AdminGuard>
      <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">User Suggestions</h1>
        <p className="mt-1 text-muted-foreground">Review and respond to user-submitted improvement ideas.</p>
      </div>

      {/* Stats */}
      {!loading && suggestions.length > 0 && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {STATUS_OPTIONS.map((st) => {
            const count = suggestions.filter((s) => s.status === st.value).length;
            const Icon = st.icon;
            return (
              <Card key={st.value}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <div className={`text-2xl font-bold ${statusColor(st.value).split(' ')[0]}`}>{count}</div>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{st.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Search suggestions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : suggestions.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Lightbulb className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">No suggestions found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {suggestions.map((s) => (
            <Card key={s.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{s.title}</h3>
                      <span className={`rounded-md border px-2 py-0.5 text-xs font-medium ${statusColor(s.status)}`}>
                        {STATUS_OPTIONS.find((st) => st.value === s.status)?.label || s.status}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-muted-foreground">{s.description}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">{CATEGORIES[s.category] || s.category}</Badge>
                      <span className="text-xs text-muted-foreground">
                        by {s.profiles?.full_name || s.profiles?.username || 'Unknown'} · {timeAgo(s.created_at)}
                      </span>
                    </div>
                    {s.admin_response && (
                      <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                        <div className="flex items-center gap-1.5">
                          <MessageSquare className="h-3.5 w-3.5 text-primary" />
                          <span className="text-xs font-medium text-primary">Admin Response</span>
                          {s.responded_at && <span className="text-xs text-muted-foreground">· {timeAgo(s.responded_at)}</span>}
                        </div>
                        <p className="mt-1.5 text-sm text-muted-foreground">{s.admin_response}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Select value={s.status} onValueChange={(v) => updateStatus(s.id, v)}>
                      <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((st) => <SelectItem key={st.value} value={st.value}>{st.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => {
                        if (respondingId === s.id) {
                          setRespondingId(null);
                        } else {
                          setRespondingId(s.id);
                          setResponseText(s.admin_response || '');
                          setNewStatus(s.status);
                        }
                      }}
                    >
                      <MessageSquare className="mr-1 h-3 w-3" /> {respondingId === s.id ? 'Cancel' : 'Respond'}
                    </Button>
                  </div>
                </div>
                {respondingId === s.id && (
                  <div className="mt-4 space-y-3 border-t border-border/60 pt-4">
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger className="w-full sm:w-44 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((st) => <SelectItem key={st.value} value={st.value}>{st.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Textarea
                      placeholder="Write your response to the user..."
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      rows={3}
                      className="resize-y"
                    />
                    <Button size="sm" onClick={() => respondToSuggestion(s.id)} disabled={saving || !responseText.trim()}>
                      {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Send Response
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>
    </AdminGuard>
  );
}
