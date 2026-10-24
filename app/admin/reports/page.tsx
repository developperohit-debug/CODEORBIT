'use client';

import { useEffect, useState, useCallback } from 'react';
import { Check, Flag, X } from 'lucide-react';
import { AdminGuard } from '@/components/admin-guard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { timeAgo } from '@/lib/format';
import type { ContentReport } from '@/lib/types';

export default function AdminReportsPage() {
  const { toast } = useToast();
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('content_reports').select('*').order('created_at', { ascending: false });
    setReports((data as ContentReport[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(r: ContentReport, status: 'Resolved' | 'Dismissed') {
    const { error } = await supabase.from('content_reports').update({ status }).eq('id', r.id);
    if (error) { toast({ title: 'Failed', variant: 'destructive' }); return; }
    toast({ title: `Report ${status.toLowerCase()}` });
    load();
  }

  return (
    <AdminGuard>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Content Reports</h1>
        <p className="mt-1 text-muted-foreground">Review and resolve user-submitted reports.</p>
      </div>

      {loading ? <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Card key={i}><CardContent className="h-16" /></Card>)}</div> : reports.length === 0 ? (
        <Card><CardContent className="py-16 text-center"><Flag className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><p className="text-muted-foreground">No reports filed.</p></CardContent></Card>
      ) : (
        <div className="space-y-2">
          {reports.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{r.target_type}</Badge>
                    <Badge variant="outline" className={r.status === 'Pending' ? 'text-warning border-warning/20' : r.status === 'Resolved' ? 'text-success border-success/20' : ''}>{r.status}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{r.reason}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{timeAgo(r.created_at)}</p>
                </div>
                {r.status === 'Pending' && (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => updateStatus(r, 'Resolved')} className="text-success"><Check className="mr-1 h-3.5 w-3.5" /> Resolve</Button>
                    <Button variant="ghost" size="sm" onClick={() => updateStatus(r, 'Dismissed')}><X className="mr-1 h-3.5 w-3.5" /> Dismiss</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminGuard>
  );
}
