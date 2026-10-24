'use client';

import { useEffect, useState } from 'react';
import { Loader2, Save, Shield, Trash2 } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { isValidUrl } from '@/lib/format';
import { useRouter } from 'next/navigation';
import type { Profile } from '@/lib/types';

export default function ProfileSettingsPage() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(!profile);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Profile>>({});

  useEffect(() => {
    if (profile) {
      setForm(profile);
      setLoading(false);
    }
  }, [profile]);

  const update = (key: keyof Profile, value: any) => setForm((p) => ({ ...p, [key]: value }));

  async function save() {
    if (!user) return;
    if (form.github_url && !isValidUrl(form.github_url as string)) {
      toast({ title: 'Invalid GitHub URL', variant: 'destructive' }); return;
    }
    if (form.linkedin_url && !isValidUrl(form.linkedin_url as string)) {
      toast({ title: 'Invalid LinkedIn URL', variant: 'destructive' }); return;
    }
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      full_name: form.full_name,
      username: form.username || null,
      phone: form.phone || null,
      contact_email: form.contact_email || null,
      avatar_url: form.avatar_url || null,
      bio: form.bio || null,
      college: form.college || null,
      degree: form.degree || null,
      branch: form.branch || null,
      graduation_year: form.graduation_year ? Number(form.graduation_year) : null,
      current_semester: form.current_semester || null,
      country: form.country || null,
      github_url: form.github_url || null,
      linkedin_url: form.linkedin_url || null,
      leetcode_username: form.leetcode_username || null,
      primary_language: form.primary_language,
      career_goal: form.career_goal,
      daily_learning_time: form.daily_learning_time,
      skills: form.skills || [],
      is_public: form.is_public,
    }).eq('id', user.id);
    setSaving(false);
    if (error) { toast({ title: 'Save failed', description: error.message, variant: 'destructive' }); return; }
    await refreshProfile();
    toast({ title: 'Profile updated' });
  }

  async function deleteAccount() {
    if (!user) return;
    const { error } = await supabase.from('profiles').delete().eq('id', user.id);
    if (error) { toast({ title: 'Failed to delete profile', variant: 'destructive' }); return; }
    await signOut();
    router.push('/');
  }

  if (loading) return <AppShell><Skeleton className="h-64 w-full" /></AppShell>;

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Profile Settings</h1>
        <p className="mt-1 text-muted-foreground">Manage your profile and account preferences.</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Basic Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Full name</Label>
              <Input value={form.full_name || ''} onChange={(e) => update('full_name', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Username</Label>
              <Input value={form.username || ''} onChange={(e) => update('username', e.target.value)} autoCapitalize="none" spellCheck={false} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Phone number</Label>
                <Input value={form.phone || ''} onChange={(e) => update('phone', e.target.value)} placeholder="+91 98765 43210" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.contact_email || ''} onChange={(e) => update('contact_email', e.target.value)} placeholder="you@example.com" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea value={form.bio || ''} onChange={(e) => update('bio', e.target.value)} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Profile picture URL</Label>
              <Input value={form.avatar_url || ''} onChange={(e) => update('avatar_url', e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>Skills (comma-separated)</Label>
              <Input
                value={(form.skills || []).join(', ')}
                onChange={(e) => update('skills', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Education</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>College / Organization</Label><Input value={form.college || ''} onChange={(e) => update('college', e.target.value)} /></div>
            <div className="space-y-2"><Label>Degree</Label><Input value={form.degree || ''} onChange={(e) => update('degree', e.target.value)} /></div>
            <div className="space-y-2"><Label>Branch</Label><Input value={form.branch || ''} onChange={(e) => update('branch', e.target.value)} /></div>
            <div className="space-y-2"><Label>Graduation year</Label><Input type="number" value={form.graduation_year || ''} onChange={(e) => update('graduation_year', e.target.value)} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Links & Profiles</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>GitHub URL</Label><Input value={form.github_url || ''} onChange={(e) => update('github_url', e.target.value)} placeholder="https://github.com/..." /></div>
            <div className="space-y-2"><Label>LinkedIn URL</Label><Input value={form.linkedin_url || ''} onChange={(e) => update('linkedin_url', e.target.value)} placeholder="https://linkedin.com/in/..." /></div>
            <div className="space-y-2"><Label>LeetCode username</Label><Input value={form.leetcode_username || ''} onChange={(e) => update('leetcode_username', e.target.value)} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Learning Preferences</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Primary language</Label>
              <Select value={form.primary_language || 'JavaScript'} onValueChange={(v) => update('primary_language', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['JavaScript','TypeScript','Python','Java','C++','Go','Rust'].map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Career goal</Label>
              <Select value={form.career_goal || 'Software Engineer'} onValueChange={(v) => update('career_goal', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Software Engineer','Full-Stack Developer','Frontend Developer','Backend Developer','Data Engineer','DevOps Engineer','Competitive Programmer'].map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Daily learning time</Label>
              <Select value={form.daily_learning_time || '1-2 hours'} onValueChange={(v) => update('daily_learning_time', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['30 minutes','1-2 hours','2-4 hours','4+ hours'].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-elevated p-3">
              <div>
                <Label>Public profile</Label>
                <p className="text-xs text-muted-foreground">Allow others to find you in the directory</p>
              </div>
              <Switch checked={form.is_public ?? true} onCheckedChange={(v) => update('is_public', v)} />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete Account</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                <AlertDialogDescription>This will permanently delete your profile and all associated data. This action cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={deleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-elevated p-4">
          <Shield className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
          <p className="text-xs text-muted-foreground">
            Your profile data is used to personalize your experience and build your public developer profile. Private information like your email is never shown to other users. See our <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a> for details.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
