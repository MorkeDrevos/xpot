'use client';

import { ReactNode, useMemo } from 'react';

import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { clusterApiUrl } from '@solana/web3.js';

import { I18nProvider } from '@/lib/i18n';

export default function Providers({ children }: { children: ReactNode }) {
  const network = WalletAdapterNetwork.Mainnet;

  const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.trim() || clusterApiUrl(network);

  const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()], []);

  return (
    <I18nProvider>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          {children}
        </WalletProvider>
      </ConnectionProvider>
    </I18nProvider>
  );
}
