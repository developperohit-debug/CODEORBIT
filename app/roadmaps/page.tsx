'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/supabase';
import type { Roadmap } from '@/lib/types';

export default function RoadmapsPage() {
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('roadmaps').select('*').eq('is_published', true).order('created_at');
      setRoadmaps((data as Roadmap[]) || []);
      setLoading(false);
    })();
  }, []);

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Learning Roadmaps</h1>
        <p className="mt-1 text-muted-foreground">Follow a structured path from fundamentals to real-world projects.</p>
      </div>
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : roadmaps.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">No roadmaps published yet.</CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {roadmaps.map((r) => (
            <Link key={r.id} href={`/roadmaps/${r.id}`}>
              <Card className="group h-full transition-all hover:border-primary/40">
                <CardHeader>
                  <div className="mb-2 inline-flex w-fit rounded-lg bg-primary/10 p-2.5 text-primary">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-xl">{r.name}</CardTitle>
                  {r.description && <CardDescription>{r.description}</CardDescription>}
                </CardHeader>
                <CardContent>
                  <span className="inline-flex items-center text-sm font-medium text-primary group-hover:underline">
                    Start roadmap <ArrowRight className="ml-1 h-3 w-3" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
