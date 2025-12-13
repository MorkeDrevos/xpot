// app/hub/history/HistoryClient.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMemo } from 'react';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

import XpotPageShell from '../../../components/XpotPageShell';
import { History, ArrowLeft } from 'lucide-react';

export default function HistoryClient() {
  const { publicKey } = useWallet();

  const walletLabel = useMemo(() => {
    const s = publicKey?.toBase58() ?? '';
    if (!s) return 'Not connected';
    return `${s.slice(0, 4)}…${s.slice(-4)}`;
  }, [publicKey]);

  return (
    <XpotPageShell
      title="History"
      subtitle="Recent XPOT winners and your past entries"
      showHeader
      showTopBar
      rightSlot={<WalletMultiButton />}
    >
      <div className="space-y-6 p-4 text-slate-200">
        <div className="flex items-center gap-3">
          <Link
            href="/hub"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>

          <div className="ml-auto text-xs text-slate-400">
            Wallet: <span className="text-slate-200">{walletLabel}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center gap-3">
            <Image
              src="/img/xpot-logo-light.png"
              alt="XPOT"
              width={120}
              height={32}
              className="h-8 w-auto"
            />
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-slate-200">
              <History className="h-4 w-4" />
              History
            </div>
          </div>

          <p className="mt-4 text-slate-300">
            History page content coming soon…
          </p>
        </div>
      </div>
    </XpotPageShell>
  );
}
