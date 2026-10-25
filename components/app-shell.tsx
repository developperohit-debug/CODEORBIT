'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BookOpen,
  Calendar,
  Compass,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  Shield,
  Trophy,
  Users,
  X,
  Target,
  Lightbulb,
} from 'lucide-react';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import { initials } from '@/lib/format';

interface NavSection {
  heading: string;
  items: { label: string; href: string; icon: React.ElementType }[];
}

const navSections: NavSection[] = [
  {
    heading: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: Home },
    ],
  },
  {
    heading: 'Practice',
    items: [
      { label: 'DSA Tracker', href: '/dsa', icon: Compass },
      { label: 'Analytics', href: '/analytics', icon: Target },
    ],
  },
  {
    heading: 'Learn',
    items: [
      { label: 'Roadmaps', href: '/roadmaps', icon: BookOpen },
    ],
  },
  {
    heading: 'Discover',
    items: [
      { label: 'Opportunities', href: '/opportunities', icon: Trophy },
      { label: 'Events', href: '/opportunities', icon: Calendar },
    ],
  },
  {
    heading: 'Community',
    items: [
      { label: 'Discussions', href: '/discussions', icon: MessageSquare },
      { label: 'Coding Groups', href: '/community', icon: Users },
      { label: 'Developers', href: '/community', icon: Users },
      { label: 'Messages', href: '/messages', icon: MessageSquare },
    ],
  },
  {
    heading: 'Personal',
    items: [
      { label: 'Profile', href: '/profile', icon: Settings },
      { label: 'Suggest', href: '/suggestions', icon: Lightbulb },
    ],
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, isAdmin, loading, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    router.replace('/signin');
    return null;
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b border-border/60 px-4">
        <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
          <Logo />
        </Link>
      </div>
      <nav className="flex-1 space-y-4 overflow-y-auto p-3">
        {navSections.map((section) => (
          <div key={section.heading}>
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              {section.heading}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={`${section.heading}-${item.label}`}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-elevated hover:text-foreground'
                    )}
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
        {isAdmin && (
          <div>
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Administration
            </p>
            <Link
              href="/admin"
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                pathname.startsWith('/admin') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-elevated hover:text-foreground'
              )}
            >
              <Shield className="h-4 w-4 flex-shrink-0" />
              Admin Dashboard
            </Link>
          </div>
        )}
      </nav>
      <div className="border-t border-border/60 p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-elevated">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/20 text-xs font-semibold text-primary">
                  {profile ? initials(profile.full_name) : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium">{profile?.full_name || profile?.username || 'Developer'}</p>
                <p className="truncate text-xs text-muted-foreground">{profile?.college || 'Set your college'}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile"><Settings className="mr-2 h-4 w-4" /> Profile Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/developers/${user.id}`}><Users className="mr-2 h-4 w-4" /> Public Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () => {
                await signOut();
                router.push('/');
              }}
              className="text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-border/60 bg-card lg:block">
        {sidebar}
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-border/60 bg-card animate-slide-in-right">
            <button className="absolute right-3 top-4 text-muted-foreground" onClick={() => setMobileOpen(false)} aria-label="Close menu">
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl sm:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/opportunities">
                <Calendar className="mr-2 h-4 w-4" /> Events
              </Link>
            </Button>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
