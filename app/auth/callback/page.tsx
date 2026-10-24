'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Logo } from '@/components/logo';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/dashboard';

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        const uid = data.session.user.id;
        const { data: profile } = await supabase.from('profiles').select('id').eq('id', uid).maybeSingle();
        if (!profile) {
          router.replace('/onboarding');
          return;
        }
        router.replace(next);
      } else {
        router.replace('/signin');
      }
    })();
  }, [router, next]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <Logo size="lg" />
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Completing sign in…
      </div>
    </div>
  );
}
