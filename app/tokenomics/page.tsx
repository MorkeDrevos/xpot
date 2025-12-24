// app/tokenomics/page.tsx
import { Suspense } from 'react';
import TokenomicsClient from './TokenomicsClient';

export default function TokenomicsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 py-10">
          <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Loading</p>
            <p className="mt-2 text-sm text-slate-300">Preparing tokenomics view…</p>
          </div>
        </div>
      }
    >
      <TokenomicsClient />
    </Suspense>
  );
}
