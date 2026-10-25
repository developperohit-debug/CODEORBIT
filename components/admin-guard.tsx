'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Code2,
  BookOpen,
  Calendar,
  Flag,
  Megaphone,
  Shield,
  ArrowLeft,
  Lightbulb,
} from 'lucide-react';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';

const adminNav = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'DSA Problems', href: '/admin/problems', icon: Code2 },
  { label: 'Roadmaps', href: '/admin/roadmaps', icon: BookOpen },
  { label: 'Events', href: '/admin/events', icon: Calendar },
  { label: 'Reports', href: '/admin/reports', icon: Flag },
  { label: 'Announcements', href: '/admin/announcements', icon: Megaphone },
  { label: 'Suggestions', href: '/admin/suggestions', icon: Lightbulb },
];

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    window.location.href = '/signin';
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <Shield className="h-12 w-12 text-muted-foreground" />
        <h1 className="text-xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">You don&apos;t have administrator privileges.</p>
        <Button asChild><Link href="/dashboard">Back to Dashboard</Link></Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 border-r border-border/60 bg-card lg:block">
        <div className="flex h-16 items-center border-b border-border/60 px-4">
          <Logo />
        </div>
        <nav className="space-y-1 p-3">
          <div className="mb-2 flex items-center gap-2 px-3 py-1 text-xs font-semibold uppercase text-primary">
            <Shield className="h-3 w-3" /> Admin
          </div>
          {adminNav.map((item) => {
            const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className={cn('flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors', active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-elevated hover:text-foreground')}>
                <item.icon className="h-4 w-4" /> {item.label}
              </Link>
            );
          })}
          <div className="my-3 border-t border-border/60" />
          <Link href="/dashboard" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-elevated hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to App
          </Link>
        </nav>
      </aside>
      <div className="lg:pl-60">
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
