'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Bookmark, BookmarkCheck, Calendar, Code2, Rocket, MapPin, Search, Trophy, Clock, ExternalLink } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { computeEventStatus, eventStatusColor, formatDate, formatDateTime } from '@/lib/format';
import type { Event, EventBookmark } from '@/lib/types';

export default function OpportunitiesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('upcoming');

  const loadEvents = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('events').select('*').eq('is_published', true);
    if (category !== 'all') q = q.eq('category', category);
    if (search) q = q.ilike('title', `%${search}%`);
    q = q.order('start_date');
    const { data, error } = await q;
    if (error) {
      toast({ title: 'Failed to load events', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }
    setEvents((data as Event[]) || []);
    setLoading(false);
  }, [category, search, toast]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  useEffect(() => {
    if (!user) return;
    supabase.from('event_bookmarks').select('event_id').eq('user_id', user.id).then(({ data }) => {
      setBookmarks(new Set((data as EventBookmark[])?.map((b) => b.event_id) || []));
    });
  }, [user]);

  async function toggleBookmark(eventId: string) {
    if (!user) return;
    const isBookmarked = bookmarks.has(eventId);
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (isBookmarked) next.delete(eventId); else next.add(eventId);
      return next;
    });
    if (isBookmarked) {
      await supabase.from('event_bookmarks').delete().eq('user_id', user.id).eq('event_id', eventId);
    } else {
      await supabase.from('event_bookmarks').insert({ user_id: user.id, event_id: eventId });
    }
  }

  const enriched = events.map((e) => ({ ...e, computedStatus: computeEventStatus(e.start_date, e.end_date, e.status) }));
  const filtered = statusFilter === 'all'
    ? enriched
    : enriched.filter((e) => e.computedStatus.toLowerCase() === statusFilter);

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Opportunities</h1>
        <p className="mt-1 text-muted-foreground">Discover coding contests and hackathons.</p>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search events..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Tabs value={category} onValueChange={setCategory}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="Coding Contest">Contests</TabsTrigger>
            <TabsTrigger value="Hackathon">Hackathons</TabsTrigger>
          </TabsList>
        </Tabs>
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-16 text-center"><Trophy className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><p className="text-muted-foreground">No events match your filters.</p><p className="mt-1 text-xs text-muted-foreground">Try changing the category or status filter.</p></CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((e) => (
            <Card key={e.id} className="group transition-all hover:border-primary/40">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/opportunities/${e.id}`} className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      {e.category === 'Coding Contest' ? <Code2 className="h-4 w-4 text-primary" /> : <Rocket className="h-4 w-4 text-primary" />}
                      <Badge variant="outline" className="text-[10px]">{e.category}</Badge>
                    </div>
                    <h3 className="font-medium transition-colors group-hover:text-primary">{e.title}</h3>
                    {e.organizer && <p className="mt-1 text-xs text-muted-foreground">by {e.organizer}</p>}
                  </Link>
                  <button onClick={() => toggleBookmark(e.id)} className="text-muted-foreground hover:text-primary">
                    {bookmarks.has(e.id) ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4" />}
                  </button>
                </div>
                <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2"><Calendar className="h-3 w-3" /> {formatDate(e.start_date)}</div>
                  {e.format && <div className="flex items-center gap-2"><MapPin className="h-3 w-3" /> {e.format}</div>}
                  {e.registration_deadline && (
                    <div className="flex items-center gap-2"><Clock className="h-3 w-3" /> Reg. by {formatDateTime(e.registration_deadline)}</div>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className={`rounded-md border px-2 py-0.5 text-xs font-medium ${eventStatusColor(e.computedStatus)}`}>{e.computedStatus}</span>
                  {e.prize_details && <span className="flex items-center gap-1 text-xs text-warning"><Trophy className="h-3 w-3" /> Prizes</span>}
                </div>
                {e.registration_url && (
                  <Button variant="outline" size="sm" className="mt-3 w-full" asChild>
                    <a href={e.registration_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-3 w-3" /> Register
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
