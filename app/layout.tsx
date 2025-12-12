// app/layout.tsx
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ClerkProvider } from '@clerk/nextjs';

import './globals.css';
import PreLaunchBanner from '@/components/PreLaunchBanner';
import XpotLogoLottie from '@/components/XpotLogoLottie';

export const metadata: Metadata = {
  title: 'XPOT',
  description: 'The daily on-chain XPOT pool for X-powered holders.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="bg-black text-slate-50 antialiased">
          {/* Fixed purple strip at top */}
          <PreLaunchBanner />

          {/* Push content below the fixed banner */}
          <div className="pt-9">
            {/* XPOT animated logo header (optional, tweak as you like) */}
            <header className="flex items-center justify-center py-6">
              <XpotLogoLottie className="h-12 w-12" />
            </header>

            {children}
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
