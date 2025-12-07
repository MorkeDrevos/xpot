// app/layout.tsx
import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export const metadata: Metadata = {
  title: 'XPOT',
  description: 'One protocol. One identity. One daily XPOT draw.',
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
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
