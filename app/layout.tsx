// app/layout.tsx
import type { Metadata } from 'next';
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
    // You currently have: public/img/favicon.png
    icon: [{ url: '/img/favicon.png', type: 'image/png' }],

    // Only keep this if you actually have an apple icon file.
    // If you don’t, delete this to avoid 404 spam.
    // apple: [{ url: '/img/apple-icon.png', type: 'image/png' }],
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider>
          <Providers>{children}</Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
