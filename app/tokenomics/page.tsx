// app/tokenomics/page.tsx
import type { Metadata } from 'next';
import { Suspense } from 'react';
import TokenomicsClient from './TokenomicsClient';

export const metadata: Metadata = {
  title: 'Tokenomics | XPOT',
  description: 'Protocol-grade XPOT distribution. Public wallets, vesting, reserve proof and on-chain verification.',
  openGraph: {
    title: 'Tokenomics | XPOT',
    description: 'Protocol-grade XPOT distribution with public proof: reserve, vesting and token controls.',
    url: '/tokenomics',
    siteName: 'XPOT',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tokenomics | XPOT',
    description: 'Protocol-grade XPOT distribution with on-chain proof: reserve, vesting and token controls.',
  },
  alternates: {
    canonical: '/tokenomics',
  },
};

export default function TokenomicsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 py-10">
          <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Loading</p>
            <p className="mt-2 text-sm text-slate-300">Preparing tokenomics view...</p>
          </div>
        </div>
      }
    >
      <TokenomicsClient />
    </Suspense>
  );
}
