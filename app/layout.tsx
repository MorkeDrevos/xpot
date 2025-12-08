// app/layout.tsx
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

import PreLaunchBanner from '@/components/PreLaunchBanner';
import { RootClientProviders } from './providers';

export const metadata: Metadata = {
  title: 'XPOT',
  description: 'One protocol. One identity. One daily XPOT draw.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    // Don’t crash, but log loudly in prod if env is missing
    console.error('Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY – Clerk will not work correctly.');
  }

  return (
    <html lang="en">
      <body className="bg-black text-slate-50 antialiased">
        <ClerkProvider publishableKey={publishableKey ?? undefined}>
          <PreLaunchBanner />
          {/* Padding under fixed banner */}
          <div className="pt-9">
            {/* All client-side providers live here */}
            <RootClientProviders>{children}</RootClientProviders>
          </div>
        </ClerkProvider>
      </body>
    </html>
  );
}
