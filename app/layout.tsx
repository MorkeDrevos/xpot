// app/layout.tsx
import type { Metadata, Viewport } from 'next';
import React from 'react';
import { ClerkProvider } from '@clerk/nextjs';

import './globals.css';
import Providers from './providers';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://xpot.bet';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: 'XPOT',
    template: '%s | XPOT',
  },

  description: 'Daily reward protocol on Solana.',
  applicationName: 'XPOT',

  icons: {
    icon: [{ url: '/img/favicon.png', type: 'image/png' }],
  },

  openGraph: {
    type: 'website',
    siteName: 'XPOT',
    title: 'XPOT',
    description: 'Daily reward protocol on Solana.',
    url: '/',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'XPOT',
    description: 'Daily reward protocol on Solana.',
  },

  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#020617' },
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
  ],
};

// Helps prevent weird mobile scroll/viewport issues (separate from metadata in Next)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      {/* IMPORTANT:
          - make html/body full height
          - keep scrolling enabled at the root (some modals/overlays can accidentally leave overflow:hidden behind)
      */}
      <body
        className="h-full min-h-dvh overflow-y-auto overflow-x-hidden bg-[var(--xpot-bg-0)] text-[color:var(--xpot-text)]"
        style={{ overflowY: 'auto' }}
      >
        <ClerkProvider>
          <Providers>{children}</Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
