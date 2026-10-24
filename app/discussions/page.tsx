'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowUp, Bookmark, MessageSquare, Plus, Search } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { timeAgo, initials } from '@/lib/format';
import type { Discussion, DiscussionCategory } from '@/lib/types';

const CATEGORIES: DiscussionCategory[] = ['DSA','Competitive Programming','Web Development','Projects','Internships','Hackathons','General Discussion'];
const PAGE_SIZE = 10;

export default function DiscussionsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<DiscussionCategory>('DSA');
  const [newTags, setNewTags] = useState('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from('discussions')
      .select('*, author:profiles!discussions_author_id_fkey(id, full_name, avatar_url, college)')
      .order('created_at', { ascending: false });
    if (category !== 'all') q = q.eq('category', category);
    if (search) q = q.ilike('title', `%${search}%`);
    q = q.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
    const { data } = await q;
    setDiscussions((data as Discussion[]) || []);
    setLoading(false);
  }, [category, search, page]);

  useEffect(() => { load(); }, [load]);

  async function createDiscussion() {
    if (!user) return;
    if (!newTitle.trim() || !newContent.trim()) {
      toast({ title: 'Title and content are required', variant: 'destructive' });
      return;
    }
    setCreating(true);
    const tags = newTags.split(',').map((t) => t.trim()).filter(Boolean);
    const { data, error } = await supabase
      .from('discussions')
      .insert({ author_id: user.id, title: newTitle, content: newContent, category: newCategory, tags })
      .select('id')
      .single();
    setCreating(false);
    if (error) {
      toast({ title: 'Failed to create discussion', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Discussion created' });
    setDialogOpen(false);
    setNewTitle(''); setNewContent(''); setNewTags('');
    load();
  }

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Discussions</h1>
          <p className="mt-1 text-muted-foreground">Ask questions, share knowledge, and help others.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> New Discussion</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Start a new discussion</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="What's your question?" />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={newCategory} onValueChange={(v) => setNewCategory(v as DiscussionCategory)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} placeholder="Describe your question or topic..." rows={5} />
              </div>
              <div className="space-y-2">
                <Label>Tags (comma-separated)</Label>
                <Input value={newTags} onChange={(e) => setNewTags(e.target.value)} placeholder="arrays, python" />
              </div>
              <Button onClick={createDiscussion} disabled={creating} className="w-full">
                {creating ? 'Creating...' : 'Create Discussion'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search discussions..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
        </div>
        <Tabs value={category} onValueChange={(v) => { setCategory(v); setPage(1); }}>
          <TabsList className="flex-wrap">
            <TabsTrigger value="all">All</TabsTrigger>
            {CATEGORIES.slice(0, 4).map((c) => <TabsTrigger key={c} value={c}>{c}</TabsTrigger>)}
          </TabsList>
        </Tabs>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : discussions.length === 0 ? (
        <Card><CardContent className="py-16 text-center"><MessageSquare className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><p className="text-muted-foreground">No discussions yet. Start the conversation!</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {discussions.map((d) => (
            <Link key={d.id} href={`/discussions/${d.id}`}>
              <Card className="group transition-all hover:border-primary/40">
                <CardContent className="flex items-start gap-4 p-4">
                  <div className="flex flex-col items-center gap-1">
                    <ArrowUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-bold">{d.upvotes}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium group-hover:text-primary">{d.title}</h3>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-[10px]">{d.category}</Badge>
                      {d.tags.slice(0, 3).map((t) => <span key={t} className="text-muted-foreground">#{t}</span>)}
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      {d.author && (
                        <>
                          <Avatar className="h-5 w-5"><AvatarFallback className="bg-primary/20 text-[9px] text-primary">{initials(d.author.full_name)}</AvatarFallback></Avatar>
                          <span>{d.author.full_name}</span>
                        </>
                      )}
                      <span>· {timeAgo(d.created_at)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          <div className="flex items-center justify-center gap-2 pt-4">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <span className="text-sm text-muted-foreground">Page {page}</span>
            <Button variant="outline" size="sm" disabled={discussions.length < PAGE_SIZE} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
