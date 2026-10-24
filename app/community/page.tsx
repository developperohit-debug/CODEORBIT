'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Github, Linkedin, Search, Users, MessageSquare } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/supabase';
import { initials } from '@/lib/format';
import type { Profile } from '@/lib/types';

export default function CommunityPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [college, setCollege] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      let q = supabase.from('profiles').select('*').eq('is_public', true).eq('suspended', false);
      if (search) q = q.ilike('full_name', `%${search}%`);
      if (college) q = q.ilike('college', `%${college}%`);
      q = q.order('created_at', { ascending: false }).limit(50);
      const { data } = await q;
      setProfiles((data as Profile[]) || []);
      setLoading(false);
    })();
  }, [search, college]);

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Developer Community</h1>
        <p className="mt-1 text-muted-foreground">Discover developers from different colleges and backgrounds.</p>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by name..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Input placeholder="Filter by college..." value={college} onChange={(e) => setCollege(e.target.value)} className="sm:w-56" />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild><Link href="/discussions"><MessageSquare className="mr-1.5 h-3.5 w-3.5" /> Discussions</Link></Button>
        <Button variant="outline" size="sm" asChild><Link href="/messages"><span className="flex items-center">Messages <Badge variant="secondary" className="ml-1.5 text-[9px]">Beta</Badge></span></Link></Button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      ) : profiles.length === 0 ? (
        <Card><CardContent className="py-16 text-center"><Users className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><p className="text-muted-foreground">No developers found.</p></CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((p) => (
            <Link key={p.id} href={`/developers/${p.id}`}>
              <Card className="group h-full transition-all hover:border-primary/40">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/20 text-sm font-semibold text-primary">{initials(p.full_name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                      <h3 className="truncate font-medium group-hover:text-primary">{p.full_name}</h3>
                      {p.college && <p className="truncate text-xs text-muted-foreground">{p.college}</p>}
                    </div>
                  </div>
                  {p.bio && <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{p.bio}</p>}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {p.primary_language && <Badge variant="outline" className="text-[10px]">{p.primary_language}</Badge>}
                    {p.skills.slice(0, 2).map((s) => <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>)}
                    {p.github_url && <Github className="h-3.5 w-3.5 text-muted-foreground" />}
                    {p.linkedin_url && <Linkedin className="h-3.5 w-3.5 text-muted-foreground" />}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
