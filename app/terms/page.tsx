import { FileText } from 'lucide-react';
import { Logo } from '@/components/logo';

export const metadata = { title: 'Terms of Service — CodeOrbit' };

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-4xl items-center gap-2 px-6 py-4">
          <Logo />
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-8 flex items-center gap-3">
          <FileText className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
        </div>
        <p className="mb-8 text-sm text-muted-foreground">Last updated: October 2026</p>

        <div className="prose prose-invert max-w-none space-y-8 text-foreground/90">
          <section>
            <h2 className="mb-3 text-xl font-semibold">1. Acceptance of Terms</h2>
            <p className="leading-relaxed">
              These Terms of Service (&quot;Terms&quot;) govern your access to and use of CodeOrbit (the
              &quot;Service&quot;). By creating an account or using any part of the Service, you agree to be bound by
              these Terms. If you do not agree, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">2. Eligibility</h2>
            <p className="leading-relaxed">
              CodeOrbit is intended for developers and students aged 16 and older. By registering, you represent that
              you meet this requirement and are legally able to enter into these Terms in your jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">3. Your Account</h2>
            <ul className="ml-6 list-disc space-y-2 leading-relaxed">
              <li>You are responsible for safeguarding your password and for all activity under your account.</li>
              <li>You must provide accurate information during registration and keep it up to date.</li>
              <li>One person, one account. Sharing or transferring accounts is not permitted.</li>
              <li>Notify us of any unauthorized access or security breach promptly.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">4. Acceptable Use</h2>
            <p className="mb-2 leading-relaxed">You agree NOT to:</p>
            <ul className="ml-6 list-disc space-y-2 leading-relaxed">
              <li>Harass, threaten, or impersonate another member.</li>
              <li>Post spam, malware, or content that infringes intellectual-property rights.</li>
              <li>Attempt to access data that does not belong to you, or circumvent platform security.</li>
              <li>Use automated scripts to scrape, overload, or disrupt the Service.</li>
              <li>Post solutions to ongoing contest problems in a way that violates contest rules.</li>
              <li>Use the Service for any unlawful or fraudulent purpose.</li>
            </ul>
            <p className="mt-3 leading-relaxed">
              Violations may result in content removal, account suspension, or permanent ban, at the discretion of
              platform administrators.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">5. User Content</h2>
            <p className="leading-relaxed">
              You retain ownership of content you post (discussions, comments, notes, messages). By posting, you grant
              CodeOrbit a non-exclusive license to display and operate on that content within the Service. You are
              solely responsible for the accuracy and legality of your content. Do not post private information about
              others without consent.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">6. Moderation</h2>
            <p className="leading-relaxed">
              Platform administrators may review, edit, or remove content that violates these Terms. Repeated or severe
              violations may lead to account suspension. You can report inappropriate content through the report
              feature available on discussions and comments.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">7. External Links and Third-Party Content</h2>
            <p className="leading-relaxed">
              The Service links to external resources (coding platforms, editorial articles, YouTube videos, contest
              sites). We do not control and are not responsible for the content, availability, or practices of these
              third-party services. Accessing them is at your own risk.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">8. Disclaimers</h2>
            <p className="leading-relaxed">
              The Service is provided &quot;as is&quot; without warranties of any kind. We do not guarantee that the
              Service will be uninterrupted, error-free, or secure. Roadmaps, recommendations, and content are for
              educational purposes and may not reflect the most current information.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">9. Limitation of Liability</h2>
            <p className="leading-relaxed">
              To the fullest extent permitted by law, CodeOrbit shall not be liable for any indirect, incidental,
              special, or consequential damages arising from your use of the Service, including loss of data, progress,
              or account access.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">10. Termination</h2>
            <p className="leading-relaxed">
              You may delete your account at any time. We may suspend or terminate access if you violate these Terms or
              for any other reason at our discretion. Upon termination, your right to use the Service ends
              immediately.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">11. Changes to These Terms</h2>
            <p className="leading-relaxed">
              We may revise these Terms from time to time. Material changes will be announced through the platform.
              Continued use after changes take effect constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">12. Contact</h2>
            <p className="leading-relaxed">
              Questions about these Terms can be raised through the community discussions or by contacting a platform
              administrator.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
