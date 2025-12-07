// components/XLoginOverlay.tsx
'use client';

import { useCallback, useEffect } from 'react';
import Image from 'next/image';
import { useSignIn } from '@clerk/nextjs';

type XLoginOverlayProps = {
  open: boolean;
  onClose?: () => void;
};

export default function XLoginOverlay({ open, onClose }: XLoginOverlayProps) {
  const { isLoaded, signIn } = useSignIn();

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const handleXLogin = useCallback(async () => {
    if (!isLoaded || !signIn) return;

    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_twitter',
        // Where Clerk should send the browser *inside your app*
        // after it finishes the X ↔ Clerk handshake:
        redirectUrl: '/dashboard',          // intermediate route if you want one
        redirectUrlComplete: '/dashboard',  // final place user lands
      });
    } catch (error) {
      console.error('XPOT X login failed', error);
    }
  }, [isLoaded, signIn]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-2xl">
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-emerald-400/40 bg-slate-950/95 shadow-[0_0_80px_rgba(16,185,129,0.45)]">
        {/* Glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="absolute -bottom-32 right-0 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
        </div>

        {/* Close button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-700/60 bg-slate-900/80 text-slate-400 text-xs hover:bg-slate-800 hover:text-slate-100"
            aria-label="Close"
          >
            ✕
          </button>
        )}

        {/* Content */}
        <div className="relative z-10 grid gap-8 px-8 pb-8 pt-7 sm:grid-cols-[1.4fr_minmax(0,1fr)] sm:items-center">
          {/* Left: copy */}
          <div>
            <div className="mb-5 flex items-center gap-3">
              <Image
                src="/img/xpot-logo-light.png"
                alt="XPOT"
                width={120}
                height={32}
                priority
                className="drop-shadow-[0_0_18px_rgba(34,211,238,0.7)]"
              />
              <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
                Verified X access
              </span>
            </div>

            <h1 className="text-xl font-semibold text-slate-50 sm:text-2xl">
              Sign in with X to enter XPOT
            </h1>

            <p className="mt-2 text-sm text-slate-300">
              One identity, one daily draw. Your X handle becomes your on-chain XPOT ID
              for rewards and winner reveals.
            </p>

            <div className="mt-5 space-y-2 text-xs text-slate-400">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Why X login only
              </p>
              <ul className="space-y-1">
                <li>• One XPOT identity per X account.</li>
                <li>• Winners revealed by verified X handle.</li>
                <li>• Wallet always stays self-custodied on Solana.</li>
              </ul>
            </div>

            <button
              type="button"
              onClick={handleXLogin}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 via-cyan-300 to-emerald-400 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_0_30px_rgba(34,197,94,0.55)] transition hover:brightness-110 active:scale-[0.98]"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-950/10">
                X
              </span>
              <span>Continue with X / Twitter</span>
            </button>

            <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
              XPOT never posts for you and never holds your funds. We only read your public
              X profile and link it to your XPOT wallet so draws and rewards stay fully
              verifiable.
            </p>
          </div>

          {/* Right: mini card */}
          <div className="hidden sm:block">
            <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Today&apos;s XPOT
              </p>
              <p className="mt-1 text-2xl font-semibold text-emerald-300">
                $10,000
                <span className="ml-1 text-xs font-normal text-slate-400">
                  est. prize pool
                </span>
              </p>
              <p className="mt-3 text-xs text-slate-400">
                Daily draw. One winner. Paid on-chain in XPOT directly to the wallet
                behind the winning X handle.
              </p>
              <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500">
                <span>Next draw countdown</span>
                <span className="font-mono text-slate-300">23:59:59</span>
              </div>
              <div className="pointer-events-none absolute -bottom-10 -right-10 h-24 w-24 rounded-full bg-emerald-400/20 blur-2xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
