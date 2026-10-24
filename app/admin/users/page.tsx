'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, Shield, ShieldOff } from 'lucide-react';
import { AdminGuard } from '@/components/admin-guard';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { initials, formatDate } from '@/lib/format';
import type { Profile } from '@/lib/types';

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (search) q = q.or(`full_name.ilike.%${search}%,username.ilike.%${search}%,college.ilike.%${search}%`);
    q = q.limit(50);
    const { data } = await q;
    setUsers((data as Profile[]) || []);
    setLoading(false);
  }, [search]);

  useEffect(() => { load(); }, [load]);

  async function toggleSuspend(u: Profile) {
    const { error } = await supabase.from('profiles').update({ suspended: !u.suspended }).eq('id', u.id);
    if (error) { toast({ title: 'Failed', variant: 'destructive' }); return; }
    toast({ title: u.suspended ? 'User reactivated' : 'User suspended' });
    load();
  }

  return (
    <AdminGuard>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
        <p className="mt-1 text-muted-foreground">Search, review, and manage user accounts.</p>
      </div>

      <div className="mb-6 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search by name, username, or college..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Card key={i}><CardContent className="h-16" /></Card>)}</div>
      ) : users.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">No users found.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <Card key={u.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <Avatar className="h-10 w-10"><AvatarFallback className="bg-primary/20 text-xs text-primary">{initials(u.full_name)}</AvatarFallback></Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{u.full_name}</span>
                    {u.username && <span className="text-xs text-muted-foreground">@{u.username}</span>}
                    {u.suspended && <Badge variant="outline" className="text-destructive border-destructive/20">Suspended</Badge>}
                    {!u.is_public && <Badge variant="outline">Private</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{u.college || 'No college'} · Joined {formatDate(u.created_at)}</p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className={u.suspended ? 'text-success' : 'text-destructive'}>
                      {u.suspended ? <><Shield className="mr-1 h-3.5 w-3.5" /> Reactivate</> : <><ShieldOff className="mr-1 h-3.5 w-3.5" /> Suspend</>}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{u.suspended ? 'Reactivate user?' : 'Suspend user?'}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {u.suspended ? `This will restore ${u.full_name}'s account access.` : `This will prevent ${u.full_name} from using the platform. They will not be able to sign in.`}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => toggleSuspend(u)}>{u.suspended ? 'Reactivate' : 'Suspend'}</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminGuard>
  );
}
