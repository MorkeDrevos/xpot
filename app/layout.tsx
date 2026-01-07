// app/layout.tsx
import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { Analytics } from '@vercel/analytics/react';
import './globals.css';

import Providers from './providers';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://xpot.bet';

// IMPORTANT:
// Make sure this file exists in /public/img/ and is accessible at:
// https://xpot.bet/img/og.jpg
//
// Specs:
// - 1200x630
// - JPG or PNG
// - < 5MB
const OG_IMAGE_PATH = '/img/og.jpg';

function safeMetadataBase(url: string) {
  try {
    return new URL(url);
  } catch {
    return new URL('https://xpot.bet');
  }
}

export const metadata: Metadata = {
  metadataBase: safeMetadataBase(SITE_URL),

  title: {
    default: 'XPOT',
    template: '%s | XPOT',
  },

  description: 'Daily reward protocol on Solana.',
  applicationName: 'XPOT',

  icons: {
    icon: [{ url: '/img/favicon.png', type: 'image/png' }],
  },

  // Optional but nice: canonical
  alternates: {
    canonical: '/',
  },

  openGraph: {
    type: 'website',
    siteName: 'XPOT',
    title: 'XPOT',
    description: 'Daily reward protocol on Solana.',
    url: '/',
    images: [
      {
        url: OG_IMAGE_PATH,
        width: 1200,
        height: 630,
        alt: 'XPOT',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'XPOT',
    description: 'Daily reward protocol on Solana.',
    images: [OG_IMAGE_PATH],
  },

  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#020617' },
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen overflow-x-hidden">
        {/* Scroll unlock guard:
            Some modal/overlay libs set body/html overflow=hidden to lock scroll.
            If an error/route change happens and cleanup doesn't run, pages become stuck.
            This guard restores scrolling. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function () {
  function unlock() {
    try {
      var html = document.documentElement;
      var body = document.body;
      if (!html || !body) return;

      // If something left the app stuck in scroll-lock, force unlock.
      // We keep it simple: if html/body is hidden, set back to auto.
      if (getComputedStyle(html).overflow === 'hidden') html.style.overflow = 'auto';
      if (getComputedStyle(body).overflow === 'hidden') body.style.overflow = 'auto';
    } catch (_) {}
  }

  // Run immediately + on common lifecycle moments
  unlock();
  window.addEventListener('pageshow', unlock);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) unlock();
  });

  // Also keep an eye on style mutations (modals often toggle overflow dynamically)
  try {
    var mo = new MutationObserver(function () { unlock(); });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['style', 'class'] });
    document.addEventListener('DOMContentLoaded', function () {
      if (document.body) mo.observe(document.body, { attributes: true, attributeFilter: ['style', 'class'] });
      unlock();
    });
  } catch (_) {}
})();
          `,
          }}
        />

        <ClerkProvider>
          <Providers>{children}</Providers>
        </ClerkProvider>

        {/* Vercel Web Analytics (independent of Clerk mounting) */}
        <Analytics />
      </body>
    </html>
  );
}
