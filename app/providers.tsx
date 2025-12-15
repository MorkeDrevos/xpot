// app/providers.tsx
'use client';

import { ReactNode, useMemo } from 'react';

import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';

import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';

import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { clusterApiUrl } from '@solana/web3.js';

// IMPORTANT: wallet-adapter UI styles (you can move this import elsewhere if you already have it)
import '@solana/wallet-adapter-react-ui/styles.css';

export default function Providers({ children }: { children: ReactNode }) {
  const network = WalletAdapterNetwork.Mainnet;

  // You can swap this to your Helius/QuickNode RPC later via env var
  const endpoint =
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.trim() || clusterApiUrl(network);

  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    [],
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
