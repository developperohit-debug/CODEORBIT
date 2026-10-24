import Link from 'next/link';
import { Logo } from '@/components/logo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-border/60 bg-secondary/30 p-10 lg:flex">
        <div className="absolute inset-0 bg-grid bg-grid-fade opacity-30" />
        <div className="absolute left-1/2 top-1/3 h-[300px] w-[400px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />
        <Link href="/" className="relative">
          <Logo size="lg" />
        </Link>
        <div className="relative">
          <blockquote className="text-2xl font-semibold leading-snug tracking-tight">
            &ldquo;Small steps. Consistent progress. Better developers.&rdquo;
          </blockquote>
          <p className="mt-4 text-muted-foreground">
            CodeOrbit brings together the essential tools a developer needs throughout their learning journey.
          </p>
        </div>
        <div className="relative text-xs text-muted-foreground">
          © {new Date().getFullYear()} CodeOrbit
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Link href="/">
              <Logo />
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
