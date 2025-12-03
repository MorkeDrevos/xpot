// app/layout.tsx
'use client';

import './globals.css';

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

// Empty array – Phantom and others will be detected natively
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
    <html lang="en">
      <head>
  <title>XPOT · Tokenized Reward Protocol</title>
  <meta
    name="description"
    content="XPOT is a token-powered reward system for daily distributions and on-chain participation."
  />

  {/* Prevent search engines from indexing until you're confident */}
  <meta name="robots" content="index,follow" />

  {/* Favicon */}
  <link rel="icon" href="/img/favicon.png" />
  <link rel="apple-touch-icon" href="/img/favicon.png" />

  {/* OpenGraph / Social preview */}
  <meta property="og:title" content="XPOT · Tokenized Reward Protocol" />
  <meta
    property="og:description"
    content="A controlled token distribution system with daily participation mechanics."
  />
  <meta property="og:image" content="/img/xpot-logo-dark.jpg" />
  <meta property="og:type" content="website" />

  {/* X / Twitter */}
  <meta name="twitter:card" content="summary_large_image" />
</head>

      <body className="bg-black text-slate-50">
        <ConnectionProvider endpoint={endpoint}>
          <WalletProvider wallets={wallets} autoConnect>
            <WalletModalProvider>{children}</WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      </body>
    </html>
  );
}
