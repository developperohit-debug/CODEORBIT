'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

const INTERNAL_DOMAIN = 'codeorbit.app';

function usernameToEmail(username: string): string {
  return `${username.toLowerCase()}@${INTERNAL_DOMAIN}`;
}

function validateUsername(username: string): string | null {
  if (username.length < 3) return 'Username must be at least 3 characters.';
  if (username.length > 20) return 'Username must be at most 20 characters.';
  if (!/^[a-z0-9_]+$/.test(username.toLowerCase())) {
    return 'Username can only contain letters, numbers, and underscores.';
  }
  return null;
}

export default function SignUpPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const cleanUsername = username.toLowerCase().trim();
    const usernameError = validateUsername(cleanUsername);
    if (usernameError) {
      toast({ title: 'Invalid username', description: usernameError, variant: 'destructive' });
      return;
    }
    if (password.length < 6) {
      toast({ title: 'Password too short', description: 'Use at least 6 characters.', variant: 'destructive' });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }

    setLoading(true);

    // Check username uniqueness before creating the auth account
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', cleanUsername)
      .maybeSingle();

    if (existing) {
      toast({ title: 'Username taken', description: 'That username is already in use. Try another one.', variant: 'destructive' });
      setLoading(false);
      return;
    }

    const authEmail = usernameToEmail(cleanUsername);
    const { data, error } = await supabase.auth.signUp({
      email: authEmail,
      password,
      options: { data: { full_name: fullName, username: cleanUsername } },
    });

    if (error) {
      toast({ title: 'Sign up failed', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        full_name: fullName,
        username: cleanUsername,
      });
    }

    toast({ title: 'Account created', description: 'Welcome to CodeOrbit! Let&apos;s set up your profile.' });
    router.push('/onboarding');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
        <p className="mt-2 text-sm text-muted-foreground">Start your developer journey in seconds.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" placeholder="Jane Developer" value={fullName} onChange={(e) => setFullName(e.target.value)} required autoComplete="name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <div className="flex items-center rounded-md border border-input focus-within:ring-1 focus-within:ring-ring">
            <span className="pl-3 pr-1 text-sm text-muted-foreground">@</span>
            <input
              id="username"
              className="flex h-10 w-full rounded-r-md bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="jane_dev"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
            />
          </div>
          <p className="text-xs text-muted-foreground">3-20 characters. Letters, numbers, and underscores only.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input id="confirmPassword" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Create Account
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/signin" className="font-medium text-primary hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
