import { Shield } from 'lucide-react';
import { Logo } from '@/components/logo';

export const metadata = { title: 'Privacy Policy — CodeOrbit' };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-4xl items-center gap-2 px-6 py-4">
          <Logo />
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-8 flex items-center gap-3">
          <Shield className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
        </div>
        <p className="mb-8 text-sm text-muted-foreground">Last updated: October 2026</p>

        <div className="prose prose-invert max-w-none space-y-8 text-foreground/90">
          <section>
            <h2 className="mb-3 text-xl font-semibold">1. Introduction</h2>
            <p className="leading-relaxed">
              CodeOrbit (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is a developer learning platform that helps you track
              your data-structures-and-algorithms progress, follow web-development roadmaps, discover contests and
              hackathons, and connect with other developers. This Privacy Policy explains what information we collect,
              how we use it, and the choices you have. By creating an account, you agree to the practices described here.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">2. Information We Collect</h2>
            <ul className="ml-6 list-disc space-y-2 leading-relaxed">
              <li><strong>Account data:</strong> your email address and password (stored as a hashed digest by Supabase Auth). We never see or store your plaintext password.</li>
              <li><strong>Profile data:</strong> the name, bio, avatar, college, graduation year, and coding-profile links you choose to share during onboarding or from your profile settings.</li>
              <li><strong>Learning data:</strong> your problem-solving progress, bookmarks, lesson completions, notes, and roadmap progress — all tied to your account.</li>
              <li><strong>Community data:</strong> discussions, comments, votes, and private messages you create on the platform.</li>
              <li><strong>Usage data:</strong> anonymized, aggregated analytics such as page views and feature usage, collected to improve the product.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">3. How We Use Your Information</h2>
            <ul className="ml-6 list-disc space-y-2 leading-relaxed">
              <li>To provide and personalize your learning experience and recommendations.</li>
              <li>To show your progress, achievements, and public profile as you choose.</li>
              <li>To facilitate community interactions — discussions, groups, and messaging.</li>
              <li>To send service notifications (announcements, security alerts).</li>
              <li>To detect and prevent abuse, spam, and violations of our Terms of Service.</li>
              <li>To improve the platform through aggregated, non-identifying analytics.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">4. Public vs. Private Information</h2>
            <p className="leading-relaxed">
              You control your visibility. When you set your profile to public, other members can view your name,
              bio, college, and linked coding profiles. When set to private, only you and platform administrators can
              see this information. Your learning progress (DSA stats, roadmap completion) is always visible only to you.
              Messages you send are visible only to conversation participants.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">5. Data Storage and Security</h2>
            <p className="leading-relaxed">
              Your data is stored in a Supabase-hosted PostgreSQL database protected by Row Level Security (RLS)
              policies. Each user can only read and modify their own data; cross-user access is blocked at the database
              level. Administrative actions are logged in an audit trail. We use HTTPS for all traffic and follow
              industry best practices, but no system is perfectly secure — please use a strong, unique password.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">6. Data Retention</h2>
            <p className="leading-relaxed">
              We retain your data for as long as your account is active. You may request deletion of your account at
              any time from your profile settings, which removes your personal data from our systems. Some anonymized,
              aggregated data may be retained for analytics. Content you post publicly (discussions, comments) may
              remain visible to other users until you or an administrator removes it.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">7. Third-Party Services</h2>
            <p className="leading-relaxed">
              CodeOrbit integrates with Supabase (authentication and database hosting). Links you add to your profile
              may point to third-party coding platforms (LeetCode, GitHub, Codeforces) — those services have their own
              privacy policies and are not covered here.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">8. Your Rights</h2>
            <ul className="ml-6 list-disc space-y-2 leading-relaxed">
              <li><strong>Access:</strong> view your data from your profile page at any time.</li>
              <li><strong>Correction:</strong> edit your profile and preferences whenever you like.</li>
              <li><strong>Deletion:</strong> delete your account from profile settings; this action is irreversible.</li>
              <li><strong>Visibility control:</strong> toggle your profile between public and private.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">9. Changes to This Policy</h2>
            <p className="leading-relaxed">
              We may update this Privacy Policy from time to time. Material changes will be announced through the
              platform. Continued use after a change constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">10. Contact</h2>
            <p className="leading-relaxed">
              Questions about this policy or your data can be raised through the community discussions or by contacting
              a platform administrator.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
