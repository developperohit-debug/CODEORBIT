'use client';

import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Code2,
  Compass,
  Cpu,
  Rocket,
  Github,
  GraduationCap,
  LayoutDashboard,
  Lightbulb,
  LineChart,
  MessageSquare,
  Target,
  Trophy,
  Users,
} from 'lucide-react';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'DSA Tracker', href: '#dsa' },
  { label: 'Roadmaps', href: '#roadmap' },
  { label: 'Opportunities', href: '#opportunities' },
  { label: 'Community', href: '#community' },
];

const features = [
  {
    icon: LineChart,
    title: 'DSA Progress Tracking',
    desc: 'Track every problem you solve across difficulties and topics. See your strengths and gaps at a glance.',
  },
  {
    icon: Compass,
    title: 'Smart Recommendations',
    desc: 'A rules-based engine suggests what to learn next based on your progress, goals, and available time.',
  },
  {
    icon: GraduationCap,
    title: 'Structured Roadmaps',
    desc: 'Follow a phase-by-phase web development roadmap from HTML to real-world full-stack projects.',
  },
  {
    icon: Trophy,
    title: 'Contests & Hackathons',
    desc: 'Discover upcoming coding contests and hackathons with registration links and eligibility details.',
  },
  {
    icon: Users,
    title: 'Developer Community',
    desc: 'Connect with developers from different colleges, join groups, and participate in discussions.',
  },
  {
    icon: LayoutDashboard,
    title: 'Personal Analytics',
    desc: 'Visualize your weekly activity, streaks, and topic coverage with clean, meaningful charts.',
  },
];

const steps = [
  {
    icon: Rocket,
    title: 'Create your account',
    desc: 'Sign up in seconds and complete a quick onboarding to personalize your learning path.',
  },
  {
    icon: Target,
    title: 'Set your goals',
    desc: 'Tell us your career goals, current skill level, and how much time you can commit daily.',
  },
  {
    icon: Code2,
    title: 'Track your progress',
    desc: 'Solve problems, follow roadmaps, and record your status. Everything persists to your profile.',
  },
  {
    icon: BarChart3,
    title: 'Grow consistently',
    desc: 'Review your analytics, follow recommendations, and build a public developer profile.',
  },
];

const roadmapPhases = [
  'HTML', 'CSS', 'JavaScript', 'Git & GitHub', 'Responsive Design',
  'Frontend Frameworks', 'API Integration', 'Backend Fundamentals',
  'Databases', 'Authentication', 'Deployment', 'Real-world Projects',
];

const sampleProblems = [
  { t: 'Two Sum', d: 'Easy', topic: 'Arrays', status: 'Solved Independently' },
  { t: 'Reverse Linked List', d: 'Easy', topic: 'Linked Lists', status: 'Solved with Help' },
  { t: 'Binary Tree Level Order Traversal', d: 'Medium', topic: 'Trees', status: 'Attempted' },
  { t: 'Course Schedule', d: 'Medium', topic: 'Graphs', status: 'Not Started' },
];

const sampleEvents = [
  { t: 'Weekly Code Sprint', cat: 'Coding Contest', date: 'In 5 days', icon: Code2 },
  { t: 'BuildForTomorrow Hackathon', cat: 'Hackathon', date: 'In 14 days', icon: Rocket },
];

const faqs = [
  {
    q: 'Is CodeOrbit free to use?',
    a: 'Yes. CodeOrbit is free for learners. You can track your DSA progress, follow roadmaps, discover opportunities, and join the community at no cost.',
  },
  {
    q: 'Do I need a LeetCode account?',
    a: 'No. You can track problems manually by marking your status. A LeetCode username field is optional and lets you display it on your public profile.',
  },
  {
    q: 'Can I control what appears on my public profile?',
    a: 'Yes. You choose which details are public. Private information like your email is never shown in the developer directory.',
  },
  {
    q: 'How are recommendations generated?',
    a: 'Recommendations are rules-based, considering your current topics, solved problems, difficulty preference, and stated goals. The logic is designed to improve over time.',
  },
  {
    q: 'Is my learning data private?',
    a: 'Yes. Your progress, notes, and bookmarks are only visible to you. Database access policies enforce this at the server level.',
  },
  {
    q: 'What is the difference between the dashboard preview on the homepage and my real dashboard?',
    a: 'The homepage shows illustrative sample data so you can see what the platform looks like. Once you sign in, your dashboard displays real data from your account — your actual solved problems, streaks, and progress.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link href="/signin">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 bg-grid bg-grid-fade opacity-40" />
        <div className="absolute left-1/2 top-0 -z-0 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute right-0 top-1/3 -z-0 h-[300px] w-[300px] rounded-full bg-chart-4/10 blur-[100px]" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:flex lg:items-center lg:gap-12 lg:px-8 lg:py-32">
          <div className="max-w-2xl animate-fade-in">
            <Badge variant="outline" className="mb-6 border-primary/30 bg-primary/5 text-accent">
              <Sparkle /> Your all-in-one developer platform
            </Badge>
            <h1 className="text-balance text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              From your first line of code
              <span className="mt-2 block bg-gradient-to-r from-primary via-accent to-chart-4 bg-clip-text text-transparent">
                to your next big opportunity.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              CodeOrbit brings DSA practice, learning roadmaps, coding contests, and a developer
              community into one focused workspace — so you always know what to learn next.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild className="group">
                <Link href="/signup">
                  Start Your Journey
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#features">Explore the Platform</Link>
              </Button>
            </div>
          </div>

          {/* Hero visual — dashboard preview with sample data label */}
          <div className="mt-12 lg:mt-0 lg:flex-1">
            <div className="relative animate-scale-in rounded-2xl border border-border/60 bg-card p-5 shadow-2xl shadow-primary/10 glow-blue">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-destructive/70" />
                  <div className="h-3 w-3 rounded-full bg-warning/70" />
                  <div className="h-3 w-3 rounded-full bg-success/70" />
                </div>
                <span className="text-xs text-muted-foreground">codeorbit / dashboard</span>
              </div>

              {/* Sample data label */}
              <div className="mt-3 flex items-center gap-2 rounded-md border border-border/40 bg-muted/30 px-2.5 py-1">
                <Lightbulb className="h-3 w-3 text-warning" />
                <span className="text-[11px] text-muted-foreground">Sample preview — your real stats appear after sign-up</span>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {[
                  { label: 'Problems Solved', value: '142', icon: CheckCircle2, color: 'text-success' },
                  { label: 'Current Streak', value: '12 days', icon: Rocket, color: 'text-accent' },
                  { label: 'Topics Covered', value: '9 / 22', icon: BookOpen, color: 'text-primary' },
                  { label: 'Roadmap Progress', value: '38%', icon: GraduationCap, color: 'text-warning' },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-lg border border-border/60 bg-elevated p-3">
                    <div className="flex items-center justify-between">
                      <stat.icon className={`h-4 w-4 ${stat.color}`} />
                      <span className="text-lg font-bold">{stat.value}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 rounded-lg border border-border/60 bg-elevated p-4">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-medium">Weekly Activity</span>
                  <span className="text-muted-foreground">last 7 days</span>
                </div>
                <div className="flex items-end gap-1.5">
                  {[40, 65, 30, 80, 55, 90, 70].map((h, i) => (
                    <div key={i} className="flex-1">
                      <div
                        className="rounded-sm bg-gradient-to-t from-primary/40 to-accent"
                        style={{ height: `${h}px` }}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-border/60 bg-elevated p-3">
                <Lightbulb className="h-4 w-4 text-warning" />
                <span className="text-xs text-muted-foreground">
                  Next: Solve <span className="font-medium text-foreground">Binary Tree Level Order Traversal</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to grow as a developer
          </h2>
          <p className="mt-4 text-muted-foreground">
            One platform for learning, tracking, discovering, and connecting — without the clutter.
          </p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-xl border border-border/60 bg-card p-6 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-2.5 text-primary transition-transform group-hover:scale-110">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-border/60 bg-secondary/30">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How CodeOrbit works</h2>
            <p className="mt-4 text-muted-foreground">A simple, repeatable loop that keeps you moving forward.</p>
          </div>
          <div className="mt-14 grid gap-8 md:grid-cols-4">
            {steps.map((s, i) => (
              <div key={s.title} className="relative">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-primary/20">
                  <s.icon className="h-6 w-6" />
                </div>
                <div className="mb-1 text-xs font-bold text-primary">STEP {i + 1}</div>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{s.desc}</p>
                {i < steps.length - 1 && (
                  <ArrowRight className="absolute -right-4 top-6 hidden h-5 w-5 text-border md:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DSA preview */}
      <section id="dsa" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <Badge variant="outline" className="mb-4 border-primary/30 text-accent">DSA Tracker</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Track every problem. Know exactly where you stand.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Browse a curated catalogue, filter by topic and difficulty, and record your
              status for each problem. Get recommendations that respect your current level
              and gradually push you toward harder challenges.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                '22-topic taxonomy from fundamentals to advanced structures',
                'Five status levels: Not Started to Solved Independently',
                'Hints, editorials, and YouTube explanations per problem',
                'Rules-based recommendations with clear reasoning',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-success" />
                  <span className="text-sm text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
            <Button asChild className="mt-8">
              <Link href="/signup">Start tracking <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="rounded-xl border border-border/60 bg-card p-5 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Problem catalogue</span>
              <span className="rounded border border-border/40 px-1.5 py-0.5 text-[10px] text-muted-foreground">Sample</span>
            </div>
            <div className="space-y-2">
              {sampleProblems.map((p) => (
                <div key={p.t} className="flex items-center justify-between rounded-lg border border-border/60 bg-elevated p-3">
                  <div>
                    <div className="text-sm font-medium">{p.t}</div>
                    <div className="text-xs text-muted-foreground">{p.topic}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${
                      p.d === 'Easy' ? 'border-success/20 bg-success/10 text-success' :
                      p.d === 'Medium' ? 'border-warning/20 bg-warning/10 text-warning' :
                      'border-destructive/20 bg-destructive/10 text-destructive'
                    }`}>{p.d}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap preview */}
      <section id="roadmap" className="border-y border-border/60 bg-secondary/30">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="outline" className="mb-4 border-primary/30 text-accent">Learning Roadmaps</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              A clear path from beginner to builder
            </h2>
            <p className="mt-4 text-muted-foreground">
              Follow a structured web development roadmap, phase by phase, with lessons, resources, and progress tracking.
            </p>
          </div>
          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {roadmapPhases.map((phase, i) => (
              <div
                key={phase}
                className="group flex items-center gap-3 rounded-lg border border-border/60 bg-card p-4 transition-all hover:border-primary/40"
              >
                <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                  {i + 1}
                </div>
                <span className="text-sm font-medium">{phase}</span>
                <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Opportunities preview */}
      <section id="opportunities" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="order-2 lg:order-1 rounded-xl border border-border/60 bg-card p-5 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Upcoming events</span>
              <span className="rounded border border-border/40 px-1.5 py-0.5 text-[10px] text-muted-foreground">Sample</span>
            </div>
            <div className="space-y-3">
              {sampleEvents.map((e) => (
                <div key={e.t} className="flex items-center gap-4 rounded-lg border border-border/60 bg-elevated p-4">
                  <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary">
                    <e.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{e.t}</div>
                    <div className="text-xs text-muted-foreground">{e.cat}</div>
                  </div>
                  <Badge variant="outline" className="border-accent/30 text-accent">{e.date}</Badge>
                </div>
              ))}
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <Badge variant="outline" className="mb-4 border-primary/30 text-accent">Opportunities</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Never miss a contest or hackathon
            </h2>
            <p className="mt-4 text-muted-foreground">
              Browse upcoming coding contests and hackathons, filter by category, bookmark
              the ones you care about, and jump straight to registration. Events are
              date-aware — expired ones never appear as upcoming.
            </p>
            <Button asChild className="mt-8">
              <Link href="/signup">Explore opportunities <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Community preview */}
      <section id="community" className="border-y border-border/60 bg-secondary/30">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="outline" className="mb-4 border-primary/30 text-accent">Community</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Learn faster, together
            </h2>
            <p className="mt-4 text-muted-foreground">
              Join discussions, create coding groups, connect with developers from other
              colleges, and message collaborators directly.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { icon: MessageSquare, title: 'Discussions', desc: 'Ask questions, share solutions, and upvote useful posts across seven categories.' },
              { icon: Users, title: 'Developer Directory', desc: 'Discover developers by college, language, skills, and career goals.' },
              { icon: Cpu, title: 'Coding Groups', desc: 'Create or join communities around topics, colleges, or interests.' },
            ].map((c) => (
              <div key={c.title} className="rounded-xl border border-border/60 bg-card p-6">
                <c.icon className="mb-4 h-6 w-6 text-primary" />
                <h3 className="font-semibold">{c.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
          Frequently asked questions
        </h2>
        <Accordion type="single" collapsible className="mt-10">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-left text-base font-medium">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-chart-4/10 p-10 text-center sm:p-16">
          <div className="absolute left-1/2 top-0 h-[200px] w-[400px] -translate-x-1/2 rounded-full bg-primary/20 blur-[100px]" />
          <div className="relative">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to start your journey?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Join CodeOrbit today and take the first step toward becoming a better software engineer.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" asChild>
                <Link href="/signup">Get Started Free <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/signin">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-secondary/30">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="md:col-span-1">
              <Logo />
              <p className="mt-4 text-sm text-muted-foreground">
                Your developer journey, all in one orbit.
              </p>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold">Platform</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#features" className="hover:text-foreground">Features</Link></li>
                <li><Link href="#dsa" className="hover:text-foreground">DSA Tracker</Link></li>
                <li><Link href="#roadmap" className="hover:text-foreground">Roadmaps</Link></li>
                <li><Link href="#opportunities" className="hover:text-foreground">Opportunities</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-foreground">Terms of Service</Link></li>
                <li><a href="mailto:hello@codeorbit.app" className="hover:text-foreground">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold">Connect</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="https://github.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-foreground"><Github className="h-4 w-4" /> GitHub</a></li>
                <li><Link href="/signin" className="hover:text-foreground">Sign In</Link></li>
                <li><Link href="/signup" className="hover:text-foreground">Create Account</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t border-border/60 pt-6 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} CodeOrbit. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

function Sparkle() {
  return (
    <svg className="mr-1 h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5L12 2z" />
    </svg>
  );
}
