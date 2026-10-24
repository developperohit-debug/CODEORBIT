import type { Difficulty, ProblemStatus, LessonStatus, EventStatus } from '@/lib/types';

export function difficultyColor(d: Difficulty): string {
  switch (d) {
    case 'Easy':
      return 'text-success bg-success/10 border-success/20';
    case 'Medium':
      return 'text-warning bg-warning/10 border-warning/20';
    case 'Hard':
      return 'text-destructive bg-destructive/10 border-destructive/20';
  }
}

export function statusColor(s: ProblemStatus): string {
  switch (s) {
    case 'Not Started':
      return 'text-muted-foreground bg-muted/40 border-border';
    case 'Attempted':
      return 'text-warning bg-warning/10 border-warning/20';
    case 'Solved with Hints':
      return 'text-accent bg-accent/10 border-accent/20';
    case 'Solved Independently':
      return 'text-success bg-success/10 border-success/20';
    case 'Needs Revision':
      return 'text-destructive bg-destructive/10 border-destructive/20';
  }
}

export function lessonStatusColor(s: LessonStatus): string {
  switch (s) {
    case 'Not Started':
      return 'text-muted-foreground bg-muted/40 border-border';
    case 'Learning':
      return 'text-accent bg-accent/10 border-accent/20';
    case 'Practicing':
      return 'text-warning bg-warning/10 border-warning/20';
    case 'Completed':
      return 'text-success bg-success/10 border-success/20';
  }
}

export function eventStatusColor(s: EventStatus): string {
  switch (s) {
    case 'Upcoming':
      return 'text-accent bg-accent/10 border-accent/20';
    case 'Ongoing':
      return 'text-success bg-success/10 border-success/20';
    case 'Completed':
      return 'text-muted-foreground bg-muted/40 border-border';
    case 'Cancelled':
      return 'text-destructive bg-destructive/10 border-destructive/20';
  }
}

export function computeEventStatus(
  start: string,
  end: string | null,
  current: EventStatus
): EventStatus {
  if (current === 'Cancelled') return 'Cancelled';
  const now = Date.now();
  const startMs = new Date(start).getTime();
  const endMs = end ? new Date(end).getTime() : startMs + 2 * 60 * 60 * 1000;
  if (now < startMs) return 'Upcoming';
  if (now >= startMs && now <= endMs) return 'Ongoing';
  return 'Completed';
}

export function formatDate(iso: string, opts?: Intl.DateTimeFormatOptions): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...opts,
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  const wk = Math.floor(day / 7);
  if (wk < 4) return `${wk}w ago`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(day / 365)}y ago`;
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}
