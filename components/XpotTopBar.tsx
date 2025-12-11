// components/XpotTopBar.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';

type XpotTopBarProps = {
  variant?: 'default' | 'admin' | 'dashboard';
};

export function XpotTopBar({ variant = 'default' }: XpotTopBarProps) {
  return (
    <header className="mb-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Link href="/" className="inline-flex items-center gap-2">
          <Image
            src="/img/xpot-logo-light.png"
            alt="XPOT"
            width={112}
            height={30}
            priority
          />
        </Link>

        {variant === 'admin' ? (
          <span className="rounded-full border border-slate-700/80 bg-slate-900/80 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-200">
            Operations center
          </span>
        ) : (
          <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
            The X-powered reward pool
          </span>
        )}
      </div>

      {variant === 'admin' && (
        <p className="hidden text-[11px] text-slate-400 sm:block">
          Control room for today&apos;s XPOT ·{' '}
          <span className="text-emerald-300">Auto draw enabled</span> ·{' '}
          <span className="text-amber-300">Dev environment</span>
        </p>
      )}
    </header>
  );
}
