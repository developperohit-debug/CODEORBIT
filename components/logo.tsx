import { Orbit } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const dims = size === 'sm' ? 'h-7 w-7' : size === 'lg' ? 'h-10 w-10' : 'h-8 w-8';
  const text = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-lg';
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('relative grid place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-primary/20', dims)}>
        <Orbit className="h-1/2 w-1/2" />
        <div className="pointer-events-none absolute inset-0 rounded-xl border border-accent/20" />
      </div>
      <span className={cn('font-bold tracking-tight text-foreground', text)}>
        Code<span className="text-primary">Orbit</span>
      </span>
    </div>
  );
}
