'use client';

import { signIn } from 'next-auth/react';
import Image from 'next/image';

type XLoginOverlayProps = {
  visible: boolean;
};

export function XLoginOverlay({ visible }: XLoginOverlayProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-700 bg-slate-950/95 p-6 shadow-2xl">
        {/* XPOT logo */}
        <div className="mb-4 flex items-center gap-2">
          <Image
            src="/img/xpot-logo-light.png"
            alt="XPOT"
            width={120}
            height={32}
            priority
          />
        </div>

        <h1 className="text-lg font-semibold text-slate-50">
          Sign in with X to continue
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Connect your X account to claim today’s XPOT ticket and join the
          daily draw.
        </p>

        <button
          type="button"
          onClick={() =>
            signIn('twitter', { callbackUrl: '/dashboard' })
          }
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-400"
        >
          <span>Sign in with X</span>
        </button>

        <p className="mt-3 text-[11px] text-slate-500">
          We use X only as your identity layer. You stay in full control of
          your wallet at all times.
        </p>
      </div>
    </div>
  );
}
