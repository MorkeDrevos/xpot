// app/layout.tsx
'use client';

import './globals.css';
import DeployWatcher from '../components/DeployWatcher';
import ThemeToggle from '../components/ThemeToggle';

import type { ReactNode } from 'react';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { ClerkProvider } from '@clerk/nextjs';

import '@solana/wallet-adapter-react-ui/styles.css';

const endpoint = 'https://api.mainnet-beta.solana.com';
const wallets: any[] = [];

const publishableKey =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  // Fail fast so we don’t get a weird blank page
  throw new Error(
    'Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY in env vars'
  );
}

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ClerkProvider publishableKey={publishableKey}>
      <html lang="en" suppressHydrationWarning>
        <head>
          <title>XPOT · The X-Powered Reward Protocol</title>

          <meta
            name="description"
            content="XPOT is the X-powered reward protocol for daily distribution, access and on-chain participation."
          />

          {/* OpenGraph */}
          <meta property="og:image" content="/img/xpot-square-blue.jpg" />
          <meta property="og:type" content="website" />

          {/* X / Twitter */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:image" content="/img/xpot-square-blue.jpg" />

          {/* Icons */}
          <link rel="icon" href="/img/favicon.png" />
          <link rel="apple-touch-icon" href="/img/favicon.png" />

          {/* Pre-theme preload to avoid flash */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                try {
                  const theme = localStorage.getItem('xpot-theme');
                  if (theme === 'light') {
                    document.documentElement.classList.add('light');
                  }
                } catch (_) {}
              `,
            }}
          />
        </head>

        <body className="min-h-screen transition-colors duration-300">
          <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
              <WalletModalProvider>
                <DeployWatcher />
                <ThemeToggle />
                {children}
              </WalletModalProvider>
            </WalletProvider>
          </ConnectionProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
