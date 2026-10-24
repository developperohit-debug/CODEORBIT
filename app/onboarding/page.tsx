'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Check, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Logo } from '@/components/logo';
import { isValidUrl } from '@/lib/format';

const STEPS = ['Basics', 'Education', 'Profiles', 'Learning Goals'];

export default function OnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, profile, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    full_name: profile?.full_name || user?.user_metadata?.full_name || '',
    username: profile?.username || user?.user_metadata?.username || '',
    phone: profile?.phone || '',
    contact_email: profile?.contact_email || '',
    avatar_url: '',
    bio: '',
    college: '',
    degree: '',
    branch: '',
    graduation_year: '',
    current_semester: '',
    gender: '',
    country: '',
    github_url: '',
    linkedin_url: '',
    leetcode_username: '',
    primary_language: 'JavaScript',
    dsa_experience: 'Beginner',
    web_dev_experience: 'Beginner',
    career_goal: 'Software Engineer',
    daily_learning_time: '1-2 hours',
    skills: '',
  });

  const update = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  function next() {
    if (step === 0 && !form.full_name.trim()) {
      toast({ title: 'Name required', description: 'Please enter your full name.', variant: 'destructive' });
      return;
    }
    if (form.github_url && !isValidUrl(form.github_url)) {
      toast({ title: 'Invalid GitHub URL', variant: 'destructive' });
      return;
    }
    if (form.linkedin_url && !isValidUrl(form.linkedin_url)) {
      toast({ title: 'Invalid LinkedIn URL', variant: 'destructive' });
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function finish() {
    if (!user) {
      router.push('/signin');
      return;
    }
    setSaving(true);
    const skillsArr = form.skills.split(',').map((s) => s.trim()).filter(Boolean);
    const payload = {
      id: user.id,
      full_name: form.full_name,
      username: form.username || null,
      phone: form.phone || null,
      contact_email: form.contact_email || null,
      avatar_url: form.avatar_url || null,
      bio: form.bio || null,
      college: form.college || null,
      degree: form.degree || null,
      branch: form.branch || null,
      graduation_year: form.graduation_year ? parseInt(form.graduation_year) : null,
      current_semester: form.current_semester || null,
      gender: form.gender || null,
      country: form.country || null,
      github_url: form.github_url || null,
      linkedin_url: form.linkedin_url || null,
      leetcode_username: form.leetcode_username || null,
      primary_language: form.primary_language,
      dsa_experience: form.dsa_experience,
      web_dev_experience: form.web_dev_experience,
      career_goal: form.career_goal,
      daily_learning_time: form.daily_learning_time,
      skills: skillsArr,
    };

    const { error } = await supabase.from('profiles').upsert(payload);
    if (error) {
      toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
      setSaving(false);
      return;
    }
    await refreshProfile();
    toast({ title: 'Profile saved', description: 'Welcome to CodeOrbit!' });
    router.push('/dashboard');
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex h-16 max-w-3xl items-center px-4">
          <Logo />
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Set up your profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">Tell us about yourself so we can personalize your learning path.</p>
        </div>

        {/* Stepper */}
        <div className="mb-10 flex items-center gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex flex-1 items-center gap-2">
              <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                i < step ? 'bg-success text-white' : i === step ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
              }`}>
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`hidden text-sm sm:inline ${i === step ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{label}</span>
              {i < STEPS.length - 1 && <div className={`h-px flex-1 ${i < step ? 'bg-success' : 'bg-border'}`} />}
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-6">
          {step === 0 && (
            <div className="space-y-4">
              <Field label="Full name" required>
                <Input value={form.full_name} onChange={(e) => update('full_name', e.target.value)} placeholder="Jane Developer" />
              </Field>
              <Field label="Username" required>
                <Input value={form.username} onChange={(e) => update('username', e.target.value)} placeholder="jane_dev" autoCapitalize="none" spellCheck={false} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Phone number (optional)">
                  <Input value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+91 98765 43210" />
                </Field>
                <Field label="Email (optional)">
                  <Input type="email" value={form.contact_email} onChange={(e) => update('contact_email', e.target.value)} placeholder="you@example.com" />
                </Field>
              </div>
              <Field label="Profile picture URL (optional)">
                <Input value={form.avatar_url} onChange={(e) => update('avatar_url', e.target.value)} placeholder="https://..." />
              </Field>
              <Field label="Short bio (optional)">
                <Textarea value={form.bio} onChange={(e) => update('bio', e.target.value)} placeholder="A few words about you..." rows={3} />
              </Field>
              <Field label="Gender (optional)">
                <Select value={form.gender} onValueChange={(v) => update('gender', v)}>
                  <SelectTrigger><SelectValue placeholder="Prefer not to say" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Prefer not to say</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Non-binary">Non-binary</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Country (optional)">
                <Input value={form.country} onChange={(e) => update('country', e.target.value)} placeholder="India" />
              </Field>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <Field label="College or organization">
                <Input value={form.college} onChange={(e) => update('college', e.target.value)} placeholder="IIT Bombay" />
              </Field>
              <Field label="Degree">
                <Input value={form.degree} onChange={(e) => update('degree', e.target.value)} placeholder="B.Tech" />
              </Field>
              <Field label="Branch or specialization">
                <Input value={form.branch} onChange={(e) => update('branch', e.target.value)} placeholder="Computer Science" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Graduation year">
                  <Input type="number" value={form.graduation_year} onChange={(e) => update('graduation_year', e.target.value)} placeholder="2026" />
                </Field>
                <Field label="Current semester / experience">
                  <Input value={form.current_semester} onChange={(e) => update('current_semester', e.target.value)} placeholder="5th semester" />
                </Field>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <Field label="GitHub profile URL (optional)">
                <Input value={form.github_url} onChange={(e) => update('github_url', e.target.value)} placeholder="https://github.com/username" />
              </Field>
              <Field label="LinkedIn profile URL (optional)">
                <Input value={form.linkedin_url} onChange={(e) => update('linkedin_url', e.target.value)} placeholder="https://linkedin.com/in/username" />
              </Field>
              <Field label="LeetCode username (optional)">
                <Input value={form.leetcode_username} onChange={(e) => update('leetcode_username', e.target.value)} placeholder="your_leetcode_username" />
              </Field>
              <Field label="Skills (comma-separated)">
                <Input value={form.skills} onChange={(e) => update('skills', e.target.value)} placeholder="React, Node.js, Python" />
              </Field>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Primary programming language">
                  <Select value={form.primary_language} onValueChange={(v) => update('primary_language', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['JavaScript','TypeScript','Python','Java','C++','Go','Rust'].map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Career goal">
                  <Select value={form.career_goal} onValueChange={(v) => update('career_goal', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['Software Engineer','Full-Stack Developer','Frontend Developer','Backend Developer','Data Engineer','DevOps Engineer','Competitive Programmer'].map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Current DSA experience">
                  <Select value={form.dsa_experience} onValueChange={(v) => update('dsa_experience', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['Beginner','Intermediate','Advanced'].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Web dev experience">
                  <Select value={form.web_dev_experience} onValueChange={(v) => update('web_dev_experience', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['Beginner','Intermediate','Advanced'].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field label="Preferred daily learning time">
                <Select value={form.daily_learning_time} onValueChange={(v) => update('daily_learning_time', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['30 minutes','1-2 hours','2-4 hours','4+ hours'].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-elevated p-4">
                <Shield className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <p className="text-xs text-muted-foreground">
                  Your profile information is used to personalize your learning experience and build your public developer profile.
                  Private details like your email are never shown to other users. You can update your profile or delete your account at any time.
                </p>
              </div>
            </div>
          )}

          {/* Nav buttons */}
          <div className="mt-8 flex items-center justify-between">
            <Button variant="ghost" onClick={back} disabled={step === 0}>Back</Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={next}>Continue</Button>
            ) : (
              <Button onClick={finish} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Complete Setup
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}{required && <span className="ml-1 text-destructive">*</span>}</Label>
      {children}
    </div>
  );
}
