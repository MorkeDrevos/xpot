// app/providers.tsx
'use client';

import type { ReactNode } from 'react';
import { useMemo } from 'react';

import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';

// IMPORTANT: required for WalletModalProvider UI
import '@solana/wallet-adapter-react-ui/styles.css';

import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { clusterApiUrl } from '@solana/web3.js';

export default function Providers({ children }: { children: ReactNode }) {
  const endpoint = useMemo(() => {
    const env = (process.env.NEXT_PUBLIC_SOLANA_RPC_URL || '').trim();
    return env || clusterApiUrl(WalletAdapterNetwork.Mainnet);
  }, []);

  const wallets = useMemo(() => {
    return [new PhantomWalletAdapter(), new SolflareWalletAdapter()];
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
