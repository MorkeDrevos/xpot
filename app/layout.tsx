import type { ReactNode } from 'react';
import './globals.css';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import '@solana/wallet-adapter-react-ui/styles.css';

const endpoint = 'https://api.mainnet-beta.solana.com';
const wallets: any[] = []; // ✅ no Phantom adapter here

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>XPOT – Daily Crypto Jackpot</title>
        <meta
          name="description"
          content="XPOT is your entry key to a controlled daily crypto jackpot draw."
        />
        {/* favicon / OG stuff… */}
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
