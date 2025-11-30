// app/layout.tsx

'use client';

import './globals.css'; // keep this if you already had it

import { ReactNode, useMemo } from 'react';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';

// Styles for WalletMultiButton etc
import '@solana/wallet-adapter-react-ui/styles.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  const endpoint = useMemo(
    () => 'https://api.mainnet-beta.solana.com',
    [] // 👈 add this dependency array
  );

  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <html lang="en">
      <body>
        <ConnectionProvider endpoint={endpoint}>
          <WalletProvider wallets={wallets} autoConnect>
            <WalletModalProvider>{children}</WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      </body>
    </html>
  );
}
