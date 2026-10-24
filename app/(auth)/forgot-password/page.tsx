'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

const INTERNAL_DOMAIN = 'codeorbit.app';

function isEmail(value: string): boolean {
  return value.includes('@');
}

function loginIdentifierToEmail(identifier: string): string {
  const trimmed = identifier.trim();
  if (isEmail(trimmed)) return trimmed;
  return `${trimmed.toLowerCase()}@${INTERNAL_DOMAIN}`;
}

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!identifier) return;
    setLoading(true);
    const email = loginIdentifierToEmail(identifier);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ title: 'Request failed', description: error.message, variant: 'destructive' });
      return;
    }
    setSent(true);
    toast({ title: 'Check your inbox', description: 'A password reset link has been sent if the account exists.' });
  }

  if (sent) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Check your inbox</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            If an account is linked to <span className="font-medium text-foreground">{identifier}</span>, a password reset link has been sent to the associated email.
          </p>
        </div>
        <Button variant="outline" className="w-full" asChild>
          <Link href="/signin">Back to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reset your password</h1>
        <p className="mt-2 text-sm text-muted-foreground">Enter your username or email and we&apos;ll send you a reset link.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="identifier">Username or email</Label>
          <Input
            id="identifier"
            placeholder="jane_dev"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Send Reset Link
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        Remember your password?{' '}
        <Link href="/signin" className="font-medium text-primary hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
