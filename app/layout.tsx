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
const wallets = [];

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>XPOT – Daily Crypto Jackpot</title>
        <meta
          name="description"
          content="XPOT is your entry key to a controlled daily crypto jackpot draw."
        />

        {/* Favicon */}
        <link rel="icon" href="/img/favicon.png" />
        <link rel="apple-touch-icon" href="/img/favicon.png" />

        {/* OpenGraph / X preview */}
        <meta property="og:title" content="XPOT – Daily Crypto Jackpot" />
        <meta
          property="og:description"
          content="Claim one ticket per wallet. One winner every day."
        />
        <meta property="og:image" content="/img/xpot-logo-dark.jpg" />
        <meta property="og:type" content="website" />

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
