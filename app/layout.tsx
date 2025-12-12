// app/layout.tsx
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ClerkProvider } from '@clerk/nextjs';

import './globals.css';
import PreLaunchBanner from '@/components/PreLaunchBanner';
import XpotTopBar from '@/components/XpotTopBar';

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

          {/* Main top bar with animated logo */}
          <XpotTopBar />

          {/* Page content */}
          <div className="pt-4">{children}</div>
        </body>
      </html>
    </ClerkProvider>
  );
}
