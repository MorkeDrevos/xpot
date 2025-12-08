// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';

import PreLaunchBanner from '@/components/PreLaunchBanner';

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
    <html lang="en">
      <body className="bg-black text-slate-50 antialiased">
        <PreLaunchBanner />
        {/* Padding so content isn't hidden behind the fixed banner */}
        <div className="pt-9">{children}</div>
      </body>
    </html>
  );
}
