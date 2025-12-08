// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';

import { ClerkProvider } from '@clerk/nextjs';
import PreLaunchBanner from '@/components/PreLaunchBanner';
import RootClientProviders from './providers';

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

  // Safety guard: never hard-crash if Clerk env is missing
  if (!publishableKey) {
    console.error('Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY – XPOT disabled.');

    return (
      <html lang="en">
        <body className="bg-black text-slate-50 antialiased">
          <PreLaunchBanner />
          <div className="pt-9 flex min-h-screen items-center justify-center">
            <p className="text-sm text-slate-400">
              XPOT is temporarily unavailable – Clerk configuration is missing.
            </p>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body className="bg-black text-slate-50 antialiased">
        <ClerkProvider publishableKey={publishableKey}>
          <PreLaunchBanner />
          {/* Padding so content isn't hidden behind the fixed banner */}
          <div className="pt-9">
            {/* All client-side providers (Solana wallets etc.) */}
            <RootClientProviders>{children}</RootClientProviders>
          </div>
        </ClerkProvider>
      </body>
    </html>
  );
}
