// app/layout.tsx
import './globals.css';

import type { ReactNode } from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import Providers from './providers';

export const metadata = {
  title: 'XPOT - ',
  description: 'Daily XPOT draws on Solana',
};

function RootProviders({ children }: { children: ReactNode }) {
  // Keep your “Clerk optional” behavior for local builds
  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!clerkKey) return <Providers>{children}</Providers>;

  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#7c3aed',
          colorBackground: '#05060a',
          colorText: '#e5e7eb',
          borderRadius: '16px',
        },
        elements: {
          modalBackdrop: 'backdrop-blur-xl bg-black/80',
          card: 'shadow-2xl border border-white/10',
        },
      }}
    >
      <Providers>{children}</Providers>
    </ClerkProvider>
  );
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#05060a] text-slate-100 antialiased">
        <RootProviders>{children}</RootProviders>
      </body>
    </html>
  );
}
