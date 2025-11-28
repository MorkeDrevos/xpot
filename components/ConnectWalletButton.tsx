'use client';

import { useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

function formatAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export default function ConnectWalletButton() {
  const { publicKey, disconnect, connecting } = useWallet();
  const { setVisible } = useWalletModal();

  const label = useMemo(() => {
    if (connecting) return 'Connecting...';
    if (!publicKey) return 'Connect wallet';
    return formatAddress(publicKey.toBase58());
  }, [publicKey, connecting]);

  const handleClick = () => {
    if (!publicKey) {
      setVisible(true); // opens modal with Phantom / Backpack / Solflare
      return;
    }
    disconnect(); // click again to disconnect
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={connecting}
      className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {label}
    </button>
  );
}
