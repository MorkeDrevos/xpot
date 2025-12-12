// app/dashboard/history/page.tsx
'use client';

export const dynamic = 'force-dynamic';

import { useUser } from '@clerk/nextjs';
import Link from 'next/link';

import XpotPageShell from '@/components/XpotPageShell';

export default function HistoryPage() {
  const { user } = useUser();

  return (
    <XpotPageShell
      title="History"
      subtitle="Recent XPOT winners and your past entries"
    >
      <div className="p-4 text-slate-300">
        <p className="mb-4">
          History page content coming soon…
        </p>

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
