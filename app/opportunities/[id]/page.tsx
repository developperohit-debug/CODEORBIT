'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Bookmark, BookmarkCheck, Calendar, Clock, ExternalLink, MapPin, Trophy, Users } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { computeEventStatus, eventStatusColor, formatDateTime } from '@/lib/format';
import type { Event } from '@/lib/types';

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from('events').select('*').eq('id', id).maybeSingle();
      if (error || !data) { setLoading(false); return; }
      setEvent(data as Event);
      setLoading(false);
    })();
  }, [id]);

  useEffect(() => {
    if (!user) return;
    supabase.from('event_bookmarks').select('*').eq('user_id', user.id).eq('event_id', id).maybeSingle().then(({ data }) => setBookmarked(!!data));
  }, [user, id]);

  async function toggleBookmark() {
    if (!user) return;
    const next = !bookmarked;
    setBookmarked(next);
    if (next) await supabase.from('event_bookmarks').insert({ user_id: user.id, event_id: id });
    else await supabase.from('event_bookmarks').delete().eq('user_id', user.id).eq('event_id', id);
  }

  if (loading) return <AppShell><Skeleton className="h-8 w-24" /><Skeleton className="mt-4 h-64 w-full" /></AppShell>;
  if (!event) return <AppShell><div className="py-20 text-center"><p className="text-muted-foreground">Event not found.</p><Button asChild className="mt-4"><Link href="/opportunities">Back</Link></Button></div></AppShell>;

  const computedStatus = computeEventStatus(event.start_date, event.end_date, event.status);

  return (
    <AppShell>
      <Link href="/opportunities" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All opportunities
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Badge variant="outline" className="mb-2">{event.category}</Badge>
                  <h1 className="text-2xl font-bold tracking-tight">{event.title}</h1>
                  {event.organizer && <p className="mt-1 text-sm text-muted-foreground">by {event.organizer}</p>}
                </div>
                <Button variant="ghost" size="icon" onClick={toggleBookmark}>
                  {bookmarked ? <BookmarkCheck className="h-5 w-5 text-primary" /> : <Bookmark className="h-5 w-5" />}
                </Button>
              </div>
              {event.description && <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{event.description}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                {event.registration_url && (
                  <Button asChild>
                    <a href={event.registration_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 h-4 w-4" /> Register</a>
                  </Button>
                )}
                {event.event_url && (
                  <Button variant="outline" asChild>
                    <a href={event.event_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 h-4 w-4" /> Event Website</a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {event.eligibility && (
            <Card>
              <CardHeader><CardTitle className="text-lg">Eligibility</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground">{event.eligibility}</p></CardContent>
            </Card>
          )}

          {event.prize_details && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Trophy className="h-5 w-5 text-warning" /> Prizes</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground">{event.prize_details}</p></CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">Details</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className={`rounded-md border px-3 py-2 text-center font-medium ${eventStatusColor(computedStatus)}`}>{computedStatus}</div>
              <Row icon={Calendar} label="Start" value={formatDateTime(event.start_date)} />
              {event.end_date && <Row icon={Clock} label="End" value={formatDateTime(event.end_date)} />}
              {event.registration_deadline && <Row icon={Clock} label="Reg. Deadline" value={formatDateTime(event.registration_deadline)} />}
              {event.format && <Row icon={MapPin} label="Format" value={event.format} />}
              {event.timezone && <Row icon={Clock} label="Timezone" value={event.timezone} />}
              <Button variant="outline" className="w-full" onClick={toggleBookmark}>
                {bookmarked ? <BookmarkCheck className="mr-2 h-4 w-4 text-primary" /> : <Bookmark className="mr-2 h-4 w-4" />}
                {bookmarked ? 'Bookmarked' : 'Bookmark'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function Row({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-muted-foreground"><Icon className="h-3.5 w-3.5" /> {label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
