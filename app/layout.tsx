import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth-context';
import { Toaster } from '@/components/ui/toaster';
import { RohitCredit } from '@/components/rohit-credit';

export const metadata: Metadata = {
  title: 'CodeOrbit — Your Developer Journey, All in One Orbit',
  description:
    'Master DSA, build real-world projects, discover opportunities, and connect with developers who share your ambition.',
  openGraph: {
    title: 'CodeOrbit — Your Developer Journey, All in One Orbit',
    description:
      'Master DSA, build real-world projects, discover opportunities, and connect with developers who share your ambition.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="font-sans">
        <AuthProvider>
          {children}
          <Toaster />
          <RohitCredit />
        </AuthProvider>
      </body>
    </html>
  );
}
