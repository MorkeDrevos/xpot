// app/layout.tsx
import './globals.css';

import type { ReactNode } from 'react';
import { ClerkProvider } from '@clerk/nextjs';

export const metadata = {
  title: 'XPOT',
  description: 'Daily XPOT draws on Solana',
};

function RootProviders({ children }: { children: ReactNode }) {
  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!clerkKey) return <>{children}</>;
  return <ClerkProvider>{children}</ClerkProvider>;
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
