// app/layout.tsx
'use client';

import './globals.css';
import DeployWatcher from '@/components/DeployWatcher';
import ThemeToggle from '@/components/ThemeToggle';

import type { ReactNode } from 'react';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';

import '@solana/wallet-adapter-react-ui/styles.css';

// ─────────────────────────────────────────────
// Solana config
// ─────────────────────────────────────────────

const endpoint = 'https://api.mainnet-beta.solana.com';

// Empty array – Phantom and others are detected natively
const wallets: any[] = [];

// ─────────────────────────────────────────────
// Root layout
// ─────────────────────────────────────────────

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>XPOT · The X-Powered Reward Protocol</title>

        <meta
          name="description"
          content="XPOT is the X-powered reward protocol for daily distribution, access and on-chain participation."
        />

        {/* OpenGraph */}
        <meta
          property="og:title"
          content="XPOT · The X-Powered Reward Protocol"
        />
        <meta
          property="og:description"
          content="A protocol for controlled daily rewards, identity-based access and transparent distribution."
        />
        <meta property="og:image" content="/img/xpot-logo-dark.jpg" />
        <meta property="og:type" content="website" />

        {/* X / Twitter */}
        <meta name="twitter:card" content="summary_large_image" />

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
              {/* Auto-refresh on new deploy */}
              <DeployWatcher />
              {/* Dark / light toggle */}
              <ThemeToggle />
              {children}
            </WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      </body>
    </html>
  );
}
