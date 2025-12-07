// app/layout.tsx
import type { ReactNode } from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export const metadata = {
  title: 'XPOT',
  description: 'The daily on-chain XPOT pool for X-powered holders.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="bg-black text-slate-50">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
