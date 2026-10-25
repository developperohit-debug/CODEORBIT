'use client';

import { useEffect, useState, useCallback } from 'react';
import { Lightbulb, Send, Loader2, MessageSquare, CheckCircle2, Clock, XCircle, Eye } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { timeAgo } from '@/lib/format';

interface Suggestion {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  admin_response: string | null;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = [
  { value: 'feature', label: 'Feature Request' },
  { value: 'bug', label: 'Bug Report' },
  { value: 'ui', label: 'UI/UX Improvement' },
  { value: 'content', label: 'Content Suggestion' },
  { value: 'other', label: 'Other' },
];

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  open: { label: 'Open', icon: Clock, color: 'text-muted-foreground bg-muted/40 border-border' },
  under_review: { label: 'Under Review', icon: Eye, color: 'text-accent bg-accent/10 border-accent/20' },
  planned: { label: 'Planned', icon: CheckCircle2, color: 'text-primary bg-primary/10 border-primary/20' },
  implemented: { label: 'Implemented', icon: CheckCircle2, color: 'text-success bg-success/10 border-success/20' },
  declined: { label: 'Declined', icon: XCircle, color: 'text-destructive bg-destructive/10 border-destructive/20' },
};

export default function SuggestionsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('feature');
  const [submitting, setSubmitting] = useState(false);

  const loadSuggestions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('user_suggestions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Failed to load suggestions', description: error.message, variant: 'destructive' });
    } else {
      setSuggestions((data as Suggestion[]) || []);
    }
    setLoading(false);
  }, [user, toast]);

  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  async function submitSuggestion() {
    if (!user || !title.trim() || !description.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from('user_suggestions').insert({
      user_id: user.id,
      title: title.trim(),
      description: description.trim(),
      category,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: 'Failed to submit', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Suggestion submitted', description: 'Thank you! Our team will review your suggestion.' });
    setTitle('');
    setDescription('');
    setCategory('feature');
    setShowForm(false);
    loadSuggestions();
  }

  async function deleteSuggestion(id: string) {
    const { error } = await supabase.from('user_suggestions').delete().eq('id', id).eq('user_id', user?.id);
    if (error) {
      toast({ title: 'Failed to delete', description: error.message, variant: 'destructive' });
      return;
    }
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
    toast({ title: 'Suggestion deleted' });
  }

  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Suggest an Improvement</h1>
          <p className="mt-1 text-muted-foreground">Help us make CodeOrbit better. Share your ideas, report bugs, or suggest content.</p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>
          <Lightbulb className="mr-2 h-4 w-4" /> {showForm ? 'Cancel' : 'New Suggestion'}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Submit a Suggestion</CardTitle>
            <CardDescription>Your suggestion will be reviewed by our admin team.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Title</label>
              <Input
                placeholder="Brief summary of your suggestion"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full sm:w-56"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Description</label>
              <Textarea
                placeholder="Describe your suggestion in detail. What problem does it solve? How would it improve your experience?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                maxLength={2000}
                className="resize-y"
              />
              <p className="mt-1 text-xs text-muted-foreground">{description.length}/2000 characters</p>
            </div>
            <Button onClick={submitSuggestion} disabled={submitting || !title.trim() || !description.trim()}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Submit Suggestion
            </Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      ) : suggestions.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Lightbulb className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">No suggestions yet. Click &quot;New Suggestion&quot; to share an idea.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {suggestions.map((s) => {
            const statusCfg = STATUS_CONFIG[s.status] || STATUS_CONFIG.open;
            const StatusIcon = statusCfg.icon;
            const catLabel = CATEGORIES.find((c) => c.value === s.category)?.label || s.category;
            return (
              <Card key={s.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{s.title}</h3>
                        <span className={`rounded-md border px-2 py-0.5 text-xs font-medium ${statusCfg.color}`}>
                          <StatusIcon className="mr-1 inline h-3 w-3" />{statusCfg.label}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm text-muted-foreground">{s.description}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">{catLabel}</Badge>
                        <span className="text-xs text-muted-foreground">{timeAgo(s.created_at)}</span>
                        {s.status === 'open' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                            onClick={() => deleteSuggestion(s.id)}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                      {s.admin_response && (
                        <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                          <div className="flex items-center gap-1.5">
                            <MessageSquare className="h-3.5 w-3.5 text-primary" />
                            <span className="text-xs font-medium text-primary">Admin Response</span>
                          </div>
                          <p className="mt-1.5 text-sm text-muted-foreground">{s.admin_response}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
