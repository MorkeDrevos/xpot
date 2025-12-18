// app/layout.tsx
import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://xpot.bet';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  // Smart titles
  title: {
    default: 'XPOT',
    template: '%s | XPOT',
  },

  description: 'Daily reward protocol on Solana.',
  applicationName: 'XPOT',

  // Favicons / app icons (Next will serve these if you add app/icon.png etc)
  icons: {
    icon: [{ url: '/icon', type: 'image/png' }],
    apple: [{ url: '/apple-icon', type: 'image/png' }],
  },

  // Social previews (works best if you add app/opengraph-image.png + app/twitter-image.png)
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

  // Nice touch for mobile browser UI color
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#020617' },
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider>{children}</ClerkProvider>
      </body>
    </html>
  );
}
