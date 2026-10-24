'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Github, Linkedin, MessageSquare, UserPlus } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { initials } from '@/lib/format';
import type { Profile } from '@/lib/types';

export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
      setProfile(data as Profile | null);
      setLoading(false);
    })();
  }, [id]);

  async function startConversation() {
    if (!user || !profile) return;
    // Check if conversation already exists between these two users
    const { data: existing } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id);

    if (existing && existing.length > 0) {
      for (const cp of existing) {
        const { data: other } = await supabase
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', cp.conversation_id)
          .neq('user_id', user.id);
        if (other && other.some((o) => o.user_id === profile.id)) {
          window.location.href = `/messages?c=${cp.conversation_id}`;
          return;
        }
      }
    }
    // Create new conversation
    const { data: conv, error: convErr } = await supabase.from('conversations').insert({}).select('id').single();
    if (convErr || !conv) {
      toast({ title: 'Failed to start conversation', variant: 'destructive' });
      return;
    }
    await supabase.from('conversation_participants').insert([
      { conversation_id: conv.id, user_id: user.id },
      { conversation_id: conv.id, user_id: profile.id },
    ]);
    window.location.href = `/messages?c=${conv.id}`;
  }

  if (loading) return <AppShell><Skeleton className="h-8 w-24" /><Skeleton className="mt-4 h-64 w-full" /></AppShell>;
  if (!profile) return <AppShell><div className="py-20 text-center"><p className="text-muted-foreground">Profile not found.</p><Button asChild className="mt-4"><Link href="/community">Back</Link></Button></div></AppShell>;

  const isOwn = user?.id === profile.id;

  return (
    <AppShell>
      <Link href="/community" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Community
      </Link>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-primary/20 text-xl font-bold text-primary">{initials(profile.full_name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-2xl font-bold tracking-tight">{profile.full_name}</h1>
              {profile.bio && <p className="mt-2 text-sm text-muted-foreground">{profile.bio}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                {profile.college && <span>{profile.college}</span>}
                {profile.graduation_year && <span>· Class of {profile.graduation_year}</span>}
                {profile.career_goal && <span>· {profile.career_goal}</span>}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {profile.primary_language && <Badge variant="outline">{profile.primary_language}</Badge>}
                {profile.skills.map((s) => <Badge key={s} variant="outline">{s}</Badge>)}
              </div>
              <div className="mt-4 flex gap-2">
                {profile.github_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={profile.github_url} target="_blank" rel="noopener noreferrer"><Github className="mr-2 h-4 w-4" /> GitHub</a>
                  </Button>
                )}
                {profile.linkedin_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer"><Linkedin className="mr-2 h-4 w-4" /> LinkedIn</a>
                  </Button>
                )}
                {!isOwn && (
                  <Button size="sm" onClick={startConversation}>
                    <MessageSquare className="mr-2 h-4 w-4" /> Message
                  </Button>
                )}
                {isOwn && (
                  <Button size="sm" asChild><Link href="/profile">Edit Profile</Link></Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {profile.dsa_experience && <InfoCard title="DSA Experience" value={profile.dsa_experience} />}
        {profile.web_dev_experience && <InfoCard title="Web Dev Experience" value={profile.web_dev_experience} />}
        {profile.branch && <InfoCard title="Specialization" value={profile.branch} />}
        {profile.daily_learning_time && <InfoCard title="Daily Learning Time" value={profile.daily_learning_time} />}
      </div>
    </AppShell>
  );
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <Card><CardContent className="p-4">
      <p className="text-xs text-muted-foreground">{title}</p>
      <p className="mt-1 font-medium">{value}</p>
    </CardContent></Card>
  );
}
