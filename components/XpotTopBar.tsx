// components/XpotTopBar.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

import { SignOutButton } from '@clerk/nextjs';

import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

import { History, LogOut } from 'lucide-react';

type XpotTopBarProps = {
  logoHref?: string;
  pillText?: string;
  sloganRight?: string;
  rightSlot?: ReactNode;

  // If you have the purple PreLaunchBanner mounted
  hasBanner?: boolean;

  maxWidthClassName?: string; // default: max-w-[1440px]
};

export default function XpotTopBar({
  logoHref = '/',
  pillText = 'THE X-POWERED REWARD PROTOCOL',
  sloganRight,
  rightSlot,
  hasBanner = true,
  maxWidthClassName = 'max-w-[1440px]',
}: XpotTopBarProps) {
  const pathname = usePathname() || '';
  const isHub = pathname === '/hub' || pathname.startsWith('/hub/');

  // Overlap by 1px to kill any seam/gap forever (even if banner height changes)
  const top = hasBanner ? 'calc(var(--xpot-banner-h, 0px) - 1px)' : '0px';

  return (
    <header className="fixed inset-x-0 z-[60] w-full" style={{ top }}>
      {/* Bar */}
      <div className="border-b border-white/5 bg-black/70 backdrop-blur-md">
        {/* IMPORTANT: match PageShell container padding exactly */}
        <div className={`mx-auto w-full ${maxWidthClassName} px-4 sm:px-6`}>
          <div className="flex min-h-[124px] items-center justify-between gap-6">
            {/* Left */}
            <div className="flex min-w-0 items-center gap-4">
              <Link href={logoHref} className="flex shrink-0 items-center gap-3">
                <Image
                  src="/img/xpot-logo-light.png"
                  alt="XPOT"
                  width={460}
                  height={120}
                  priority
                  className="
                    h-[120px] max-h-[120px]
                    w-auto object-contain
                    animate-[xpotStarFlash_20s_ease-in-out_infinite]
                  "
                />
              </Link>

              {/* Pill + optional slogan */}
              <div className="hidden min-w-0 items-center gap-3 sm:flex">
                <span className="inline-flex min-w-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-[11px] font-semibold tracking-wide text-slate-300">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-slate-300/70 shadow-[0_0_10px_rgba(148,163,184,0.35)]" />
                  <span className="truncate opacity-85">{pillText}</span>
                </span>

                {sloganRight ? (
                  <span className="hidden items-center rounded-full border border-white/10 bg-white/[0.035] px-4 py-1.5 text-[11px] font-semibold tracking-wide text-slate-200 lg:inline-flex">
                    {sloganRight}
                  </span>
                ) : null}
              </div>
            </div>

            {/* Right */}
            <div className="flex shrink-0 items-center gap-6 text-sm text-slate-300">
              {/* 1) If caller provides a rightSlot, ALWAYS use it */}
              {rightSlot ? rightSlot : isHub ? <HubMenu /> : null}
            </div>
          </div>
        </div>
      </div>

      {/* Premium line (thin, fades before edges) */}
      <div className="relative h-[1px] w-full overflow-hidden">
        <div
          className="
            absolute left-1/2 top-0 h-full -translate-x-1/2
            w-[72%]
            bg-[linear-gradient(90deg,rgba(56,189,248,0.10)_0%,rgba(56,189,248,0.28)_18%,rgba(56,189,248,0.55)_50%,rgba(56,189,248,0.28)_82%,rgba(56,189,248,0.10)_100%)]
            opacity-80
          "
        />
        <div
          className="
            absolute top-0 h-full w-[20%]
            bg-[linear-gradient(90deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.28)_50%,rgba(255,255,255,0)_100%)]
            opacity-20
            animate-[xpotLineSweep_10s_linear_infinite]
          "
          style={{ left: '-20%' }}
        />
      </div>

      {/* local keyframes (no globals needed) */}
      <style jsx>{`
        @keyframes xpotLineSweep {
          from {
            left: -20%;
          }
          to {
            left: 120%;
          }
        }
      `}</style>
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/* Hub-only menu (History + Wallet Modal trigger + Clerk logout)               */
/* -------------------------------------------------------------------------- */

function HubMenu() {
  return (
    <div className="flex items-center gap-4">
      <Link
        href="/hub/history"
        className="
          inline-flex items-center gap-2
          rounded-full border border-white/10 bg-white/[0.03]
          px-6 py-3 text-base text-slate-200
          hover:bg-white/[0.06]
        "
      >
        <History className="h-5 w-5" />
        History
      </Link>

      {/* Wallet connect / change (opens wallet-adapter modal) */}
      <HubWalletMenuInline />

      {/* Clerk sign out */}
      <SignOutButton redirectUrl="/hub">
        <button
          type="button"
          className="
            inline-flex items-center gap-2
            rounded-full border border-white/10 bg-white/[0.03]
            px-6 py-3 text-base text-slate-200
            hover:bg-white/[0.06]
          "
        >
          <LogOut className="h-5 w-5" />
          Log out
        </button>
      </SignOutButton>
    </div>
  );
}

function HubWalletMenuInline() {
  const { setVisible } = useWalletModal();
  const { publicKey, connected } = useWallet();

  const addr = connected && publicKey ? publicKey.toBase58() : null;

  return (
    <button
      type="button"
      onClick={() => setVisible(true)}
      className="
        text-left leading-tight hover:opacity-90
        rounded-full border border-white/10 bg-white/[0.03]
        px-6 py-3
      "
    >
      <div className="text-[28px] font-medium text-slate-100">
        Select Wallet
      </div>
      <div className="text-[28px] font-medium text-slate-100">
        Change wallet
      </div>

      {addr ? (
        <div className="mt-1 text-xs text-slate-400">
          Connected: <span className="font-mono">{shortWallet(addr)}</span>
        </div>
      ) : null}
    </button>
  );
}

function shortWallet(addr: string) {
  if (!addr || addr.length < 8) return addr;
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}
