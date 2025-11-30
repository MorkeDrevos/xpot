// app/layout.tsx
'use client';

import './globals.css';

import type { ReactNode } from 'react';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';

// Styles for WalletMultiButton etc
import '@solana/wallet-adapter-react-ui/styles.css';

// ─────────────────────────────────────────────
// Solana config
// ─────────────────────────────────────────────

const endpoint = 'https://api.mainnet-beta.solana.com';
const wallets = [new PhantomWalletAdapter()];

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>XPOT – Daily Crypto Jackpot</title>
        <meta
          name="description"
          content="XPOT is your entry key to a controlled daily crypto jackpot draw."
        />
        <link rel="icon" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/favicon.png" />

        {/* Social / OG preview */}
        <meta property="og:title" content="XPOT – Daily Crypto Jackpot" />
        <meta
          property="og:description"
          content="Claim one ticket per wallet, one winner per day."
        />
        <meta property="og:image" content="/xpot-logo-dark.jpg" />
        <meta property="og:type" content="website" />
        <meta property="twitter:card" content="summary_large_image" />
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
