// app/providers.tsx
'use client';

import '@solana/wallet-adapter-react-ui/styles.css';

import { ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';

// Only use adapters that exist in your installed version
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';

type RootClientProvidersProps = {
  children: ReactNode;
};

export function RootClientProviders({ children }: RootClientProvidersProps) {
  const endpoint =
    process.env.NEXT_PUBLIC_SOLANA_RPC ??
    'https://api.mainnet-beta.solana.com';

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      // If you later install extra adapters, add them here
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
