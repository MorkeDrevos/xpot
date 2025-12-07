// app/layout.tsx
import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

import PreLaunchBanner from '@/components/PreLaunchBanner';

export const metadata: Metadata = {
  title: 'XPOT',
  description: 'Daily XPOT draws for X users',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="bg-black text-slate-50 antialiased">
          <PreLaunchBanner />
          <div className="pt-9">{children}</div>
        </body>
      </html>
    </ClerkProvider>
  );
}
