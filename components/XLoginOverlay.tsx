'use client';

import { signIn } from 'next-auth/react';
import Image from 'next/image';

type XLoginOverlayProps = {
  visible: boolean;
};

export default function XLoginOverlay({ visible }: XLoginOverlayProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      {/* Centered glassy card */}
      <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-950/90 px-6 py-6 shadow-[0_30px_120px_rgba(0,0,0,0.95)]">
        {/* XPOT mark */}
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900">
            <Image
              src="/img/xpot-mark.png"
              alt="XPOT"
              width={24}
              height={24}
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              XPOT ACCESS
            </span>
            <span className="text-sm font-medium text-slate-100">
              Sign in with X to continue
            </span>
          </div>
        </div>

        {/* Main copy – this mirrors your existing wording */}
        <p className="text-xs text-slate-300">
          XPOT links each wallet to a verified X account so every draw is tied
          to a real handle.
        </p>

        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/80 px-3 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Why X login?
          </p>
          <ul className="mt-2 space-y-1 text-[11px] text-slate-400">
            <li>• One XPOT identity per X account.</li>
            <li>• Winners revealed by X handle, never by wallet.</li>
            <li>• Your wallet always remains self-custodied.</li>
          </ul>
        </div>

        {/* Primary button */}
        <button
          type="button"
          onClick={() => signIn('twitter', { callbackUrl: '/dashboard' })}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#1D9BF0] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_40px_rgba(29,155,240,0.55)] hover:brightness-110 transition-all duration-150"
        >
          <span className="text-lg">𝕏</span>
          <span>Sign in with X (Twitter)</span>
        </button>

        {/* Small reassurance line */}
        <p className="mt-3 text-[10px] leading-relaxed text-slate-500">
          XPOT never posts on your behalf. We only read your public X profile to
          link it to your XPOT wallet.
        </p>
      </div>
    </div>
  );
}
