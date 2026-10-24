'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, ArrowUp, Bookmark, Flag, MessageSquare, Trash2 } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { timeAgo, initials } from '@/lib/format';
import type { Discussion, DiscussionComment } from '@/lib/types';

export default function DiscussionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const [comments, setComments] = useState<DiscussionComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [posting, setPosting] = useState(false);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [hasBookmarked, setHasBookmarked] = useState(false);

  const loadComments = useCallback(async () => {
    const { data } = await supabase
      .from('discussion_comments')
      .select('*, author:profiles!discussion_comments_author_id_fkey(id, full_name, avatar_url)')
      .eq('discussion_id', id)
      .order('created_at', { ascending: true });
    setComments((data as DiscussionComment[]) || []);
  }, [id]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('discussions')
        .select('*, author:profiles!discussions_author_id_fkey(id, full_name, avatar_url, college)')
        .eq('id', id)
        .maybeSingle();
      setDiscussion(data as Discussion | null);
      setLoading(false);
      loadComments();
    })();
  }, [id, loadComments]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from('discussion_votes').select('*').eq('user_id', user.id).eq('discussion_id', id).maybeSingle(),
      supabase.from('discussion_bookmarks').select('*').eq('user_id', user.id).eq('discussion_id', id).maybeSingle(),
    ]).then(([v, b]) => {
      setHasUpvoted(!!v.data);
      setHasBookmarked(!!b.data);
    });
  }, [user, id]);

  async function toggleUpvote() {
    if (!user || !discussion) return;
    const next = !hasUpvoted;
    setHasUpvoted(next);
    setDiscussion((d) => d ? { ...d, upvotes: d.upvotes + (next ? 1 : -1) } : d);
    if (next) {
      await supabase.from('discussion_votes').insert({ user_id: user.id, discussion_id: id });
      await supabase.rpc('increment_upvote', { d_id: id });
    } else {
      await supabase.from('discussion_votes').delete().eq('user_id', user.id).eq('discussion_id', id);
      await supabase.rpc('decrement_upvote', { d_id: id });
    }
  }

  async function toggleBookmark() {
    if (!user) return;
    const next = !hasBookmarked;
    setHasBookmarked(next);
    if (next) await supabase.from('discussion_bookmarks').insert({ user_id: user.id, discussion_id: id });
    else await supabase.from('discussion_bookmarks').delete().eq('user_id', user.id).eq('discussion_id', id);
  }

  async function postComment() {
    if (!user || !commentText.trim()) return;
    setPosting(true);
    const { error } = await supabase.from('discussion_comments').insert({ discussion_id: id, author_id: user.id, content: commentText });
    setPosting(false);
    if (error) { toast({ title: 'Failed to post', description: error.message, variant: 'destructive' }); return; }
    setCommentText('');
    loadComments();
  }

  async function deleteComment(commentId: string) {
    const { error } = await supabase.from('discussion_comments').delete().eq('id', commentId).eq('author_id', user!.id);
    if (error) { toast({ title: 'Failed to delete', variant: 'destructive' }); return; }
    loadComments();
  }

  async function reportContent() {
    if (!user) return;
    const { error } = await supabase.from('content_reports').insert({ reporter_id: user.id, target_type: 'discussion', target_id: id, reason: 'Reported by user' });
    if (error) { toast({ title: 'Failed to report', variant: 'destructive' }); return; }
    toast({ title: 'Reported', description: 'Thank you. Our team will review it.' });
  }

  if (loading) return <AppShell><Skeleton className="h-8 w-24" /><Skeleton className="mt-4 h-48 w-full" /></AppShell>;
  if (!discussion) return <AppShell><div className="py-20 text-center"><p className="text-muted-foreground">Discussion not found.</p><Button asChild className="mt-4"><Link href="/discussions">Back</Link></Button></div></AppShell>;

  return (
    <AppShell>
      <Link href="/discussions" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All discussions
      </Link>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <button onClick={toggleUpvote} className="flex flex-col items-center gap-1">
              <ArrowUp className={`h-5 w-5 ${hasUpvoted ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className="text-sm font-bold">{discussion.upvotes}</span>
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold tracking-tight">{discussion.title}</h1>
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="text-[10px]">{discussion.category}</Badge>
                {discussion.author && (
                  <>
                    <Avatar className="h-5 w-5"><AvatarFallback className="bg-primary/20 text-[9px] text-primary">{initials(discussion.author.full_name)}</AvatarFallback></Avatar>
                    <span>{discussion.author.full_name}</span>
                  </>
                )}
                <span>· {timeAgo(discussion.created_at)}</span>
              </div>
              <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{discussion.content}</div>
              <div className="mt-4 flex gap-2">
                <Button variant="ghost" size="sm" onClick={toggleBookmark}>
                  <Bookmark className={`mr-1 h-3.5 w-3.5 ${hasBookmarked ? 'fill-primary text-primary' : ''}`} /> {hasBookmarked ? 'Saved' : 'Save'}
                </Button>
                <Button variant="ghost" size="sm" onClick={reportContent}><Flag className="mr-1 h-3.5 w-3.5" /> Report</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments */}
      <div className="mb-4 flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <h2 className="font-semibold">{comments.length} Comments</h2>
      </div>

      <div className="mb-6">
        <Textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Write a comment..." rows={3} />
        <Button onClick={postComment} disabled={posting || !commentText.trim()} className="mt-2" size="sm">
          {posting ? 'Posting...' : 'Post Comment'}
        </Button>
      </div>

      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No comments yet. Be the first to respond!</p>
        ) : comments.map((c) => (
          <Card key={c.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8"><AvatarFallback className="bg-primary/20 text-xs text-primary">{c.author ? initials(c.author.full_name) : 'U'}</AvatarFallback></Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{c.author?.full_name || 'Unknown'}</span>
                    <span className="text-xs text-muted-foreground">{timeAgo(c.created_at)}</span>
                    {user?.id === c.author_id && (
                      <button onClick={() => deleteComment(c.id)} className="ml-auto text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{c.content}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
