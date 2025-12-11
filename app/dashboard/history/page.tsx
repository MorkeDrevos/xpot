// app/dashboard/history/page.tsx
'use client';

import { WalletReadyState } from '@solana/wallet-adapter-base';
import { useUser, SignOutButton } from '@clerk/nextjs';

import { XpotPageShell } from '@/components/XpotPageShell';

// Helpers
import Link from 'next/link';
import Image from 'next/image';

export default function HistoryPage() {
  const { user } = useUser();

  return (
    <XpotPageShell
      title="History"
      subtitle="Recent XPOT winners and your past entries"
    >
      <div className="text-slate-300 p-4">
        <p className="mb-4">History page content coming soon…</p>

        <Link
          href="/dashboard"
          className="text-teal-400 underline hover:text-teal-300"
        >
          Back to dashboard
        </Link>
      </div>
    </XpotPageShell>
  );
}
