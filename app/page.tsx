import type { Metadata } from 'next';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import PreLaunchBanner from '@/components/PreLaunchBanner';
import { RootClientProviders } from './providers';

export const metadata: Metadata = {
  title: 'XPOT',
  description: 'One protocol. One identity. One daily XPOT draw.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    console.error('Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY');
    return (
      <html lang="en">
        <body className="bg-black text-slate-50">
          <PreLaunchBanner />
          <div className="pt-9 flex min-h-screen items-center justify-center">
            <p className="text-sm text-slate-400">
              XPOT is temporarily unavailable – missing Clerk configuration.
            </p>
          </div>
        </body>
      </html>
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <html lang="en">
        <body className="bg-black text-slate-50 antialiased">
          <PreLaunchBanner />
          <div className="pt-9">
            <RootClientProviders>{children}</RootClientProviders>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
