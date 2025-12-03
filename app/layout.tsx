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
  <title>XPOT · The X-powered reward protocol</title>

  <meta
    name="description"
    content="XPOT is the X-powered reward protocol for daily distribution, access and on-chain participation."
  />

  {/* OpenGraph */}
  <meta property="og:title" content="XPOT · The X-powered reward protocol" />
  <meta
    property="og:description"
    content="A protocol for controlled daily rewards, identity-based access and transparent distribution."
  />
  <meta property="og:image" content="/img/xpot-logo-dark.jpg" />
  <meta property="og:type" content="website" />

  {/* X / Twitter */}
  <meta name="twitter:card" content="summary_large_image" />

  {/* Favicon */}
  <link rel="icon" href="/img/favicon.png" />
  <link rel="apple-touch-icon" href="/img/favicon.png" />
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
