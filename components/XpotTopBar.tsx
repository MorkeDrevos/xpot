// components/XpotTopBar.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

import { useUser, SignOutButton } from '@clerk/nextjs';

import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

import { Crown, History, LogOut, Ticket, Wallet, X } from 'lucide-react';

type HubWalletTone = 'slate' | 'emerald' | 'amber' | 'sky';

export type HubWalletStatus = {
  label: string; // e.g. "Activate wallet", "Wallet linked", "Entry secured", "XPOT winner"
  sublabel?: string; // e.g. short addr, "Required to enter", "You're in today's draw"
  tone?: HubWalletTone;
  claimed?: boolean; // used for micro-badge
  winner?: boolean; // used for micro-badge
};

type XpotTopBarProps = {
  logoHref?: string;
  pillText?: string;
  sloganRight?: string;
  rightSlot?: ReactNode;

  // Hub enhancements (optional - only used on /hub)
  hubWalletStatus?: HubWalletStatus;
  onOpenWalletModal?: () => void; // if provided, used instead of wallet-adapter modal

  // If you have the purple PreLaunchBanner mounted
  hasBanner?: boolean;

  maxWidthClassName?: string; // default: max-w-[1440px]
};

export default function XpotTopBar({
  logoHref = '/',
  pillText = 'THE X-POWERED REWARD PROTOCOL',
  sloganRight,
  rightSlot,
  hubWalletStatus,
  onOpenWalletModal,
  hasBanner = true,
  maxWidthClassName = 'max-w-[1440px]',
}: XpotTopBarProps) {
  const pathname = usePathname() || '';
  const isHub = pathname === '/hub' || pathname.startsWith('/hub/');
  const effectivePillText = isHub ? 'HOLDER DASHBOARD' : pillText;

  // Clerk is "optional" in your layout, so keep topbar safe too
  const clerkEnabled = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  // Overlap by 1px to kill any seam/gap forever (even if banner height changes)
  const top = hasBanner ? 'calc(var(--xpot-banner-h, 0px) - 1px)' : '0px';

  return (
    <header className="fixed inset-x-0 z-[60] w-full" style={{ top }}>
      <div className="border-b border-white/5 bg-black/70 backdrop-blur-md">
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
                {isHub ? (
                  <Link
                    href="/hub"
                    className="
                      inline-flex min-w-0 items-center gap-2
                      rounded-full border border-white/10 bg-white/[0.03]
                      px-4 py-1.5
                      text-[11px] font-semibold tracking-wide text-slate-300
                      transition hover:bg-white/[0.06]
                    "
                  >
                    <span className="h-2 w-2 shrink-0 rounded-full bg-slate-300/70 shadow-[0_0_10px_rgba(148,163,184,0.35)]" />
                    <span className="truncate opacity-85">{effectivePillText}</span>
                  </Link>
                ) : (
                  <span
                    className="
                      inline-flex min-w-0 items-center gap-2
                      rounded-full border border-white/10 bg-white/[0.03]
                      px-4 py-1.5
                      text-[11px] font-semibold tracking-wide text-slate-300
                    "
                  >
                    <span className="h-2 w-2 shrink-0 rounded-full bg-slate-300/70 shadow-[0_0_10px_rgba(148,163,184,0.35)]" />
                    <span className="truncate opacity-85">{effectivePillText}</span>
                  </span>
                )}

                {sloganRight ? (
                  <span className="hidden items-center rounded-full border border-white/10 bg-white/[0.035] px-4 py-1.5 text-[11px] font-semibold tracking-wide text-slate-200 lg:inline-flex">
                    {sloganRight}
                  </span>
                ) : null}
              </div>
            </div>

            {/* Right */}
            <div className="flex shrink-0 items-center gap-6 text-sm text-slate-300">
              {rightSlot ? (
                rightSlot
              ) : isHub ? (
                <HubMenu
                  clerkEnabled={clerkEnabled}
                  hubWalletStatus={hubWalletStatus}
                  onOpenWalletModal={onOpenWalletModal}
                />
              ) : (
                <DefaultNav />
              )}
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

/* ------------------------------- */
/* Non-hub default (Hub/Terms/CTA)  */
/* ------------------------------- */

function DefaultNav() {
  return (
    <>
      <Link href="/hub" className="transition hover:text-white">
        Hub
      </Link>
      <Link href="/terms" className="transition hover:text-white">
        Terms
      </Link>
      <Link
        href="/hub"
        className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black transition hover:bg-slate-200"
      >
        Enter today&apos;s XPOT →
      </Link>
    </>
  );
}

/* ------------------------------- */
/* Hub-only menu (Identity + History + Wallet + Logout) */
/* ------------------------------- */

function HubMenu({
  clerkEnabled,
  hubWalletStatus,
  onOpenWalletModal,
}: {
  clerkEnabled: boolean;
  hubWalletStatus?: HubWalletStatus;
  onOpenWalletModal?: () => void;
}) {
  const { user, isLoaded } = useUser();

  // Try to extract X identity from Clerk
  const externalAccounts = (user?.externalAccounts || []) as any[];

  const xAccount =
    externalAccounts.find(acc => {
      const provider = (acc.provider ?? '') as string;
      const p = provider.toLowerCase();
      return (
        provider === 'oauth_x' ||
        provider === 'oauth_twitter' ||
        provider === 'twitter' ||
        p.includes('twitter') ||
        p === 'x' ||
        p.includes('oauth_x')
      );
    }) || null;

  const handle =
    (xAccount?.username as string | undefined) ||
    (xAccount?.screenName as string | undefined) ||
    null;

  const avatar =
    (xAccount?.imageUrl as string | undefined) ||
    (user?.imageUrl as string | undefined) ||
    null;

  const displayHandle = handle ? `@${handle.replace(/^@/, '')}` : null;

  const initial = (displayHandle || 'X').replace(/^@/, '')[0]?.toUpperCase() || 'X';

  return (
    <div className="flex items-center gap-4">
      {/* Identity chip */}
      <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 sm:inline-flex">
        {isLoaded && avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatar}
            alt={displayHandle ?? 'X identity'}
            className="h-6 w-6 rounded-full border border-white/10 object-cover"
          />
        ) : (
          <div className="flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-[11px] font-semibold text-slate-200">
            {initial}
          </div>
        )}

        <span className="text-xs font-semibold text-slate-200">
          {isLoaded ? displayHandle ?? 'X linking…' : 'Loading…'}
        </span>
      </div>

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

      <HubWalletMenuInline hubWalletStatus={hubWalletStatus} onOpenWalletModal={onOpenWalletModal} />

      {clerkEnabled ? (
        <SignOutButton redirectUrl="/">
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
      ) : (
        <span className="text-xs text-slate-500">Auth off</span>
      )}
    </div>
  );
}

function toneRing(tone: HubWalletTone) {
  if (tone === 'emerald') return 'ring-emerald-400/20 bg-emerald-500/5';
  if (tone === 'amber') return 'ring-amber-400/20 bg-amber-500/5';
  if (tone === 'sky') return 'ring-sky-400/20 bg-sky-500/5';
  return 'ring-white/10 bg-white/[0.03]';
}

function HubWalletMenuInline({
  hubWalletStatus,
  onOpenWalletModal,
}: {
  hubWalletStatus?: HubWalletStatus;
  onOpenWalletModal?: () => void;
}) {
  const { setVisible } = useWalletModal();
  const { publicKey, connected } = useWallet();

  const addr = connected && publicKey ? publicKey.toBase58() : null;

  const label =
    hubWalletStatus?.label ??
    (connected ? 'Wallet linked' : 'Activate wallet');

  const sublabel =
    hubWalletStatus?.sublabel ??
    (addr ? shortWallet(addr) : 'Required to enter today’s XPOT');

  const tone: HubWalletTone =
    hubWalletStatus?.tone ??
    (hubWalletStatus?.winner
      ? 'sky'
      : hubWalletStatus?.claimed
      ? 'emerald'
      : connected
      ? 'sky'
      : 'amber');

  const microIcon = hubWalletStatus?.winner ? (
    <Crown className="h-4 w-4 text-sky-200" />
  ) : hubWalletStatus?.claimed ? (
    <Ticket className="h-4 w-4 text-emerald-200" />
  ) : (
    <Wallet className="h-4 w-4 text-slate-200" />
  );

  const open = () => {
    if (onOpenWalletModal) return onOpenWalletModal();
    setVisible(true);
  };

  return (
    <button
      type="button"
      onClick={open}
      className={`
        group
        text-left leading-tight hover:opacity-95
        rounded-full border border-white/10
        px-6 py-3
        ring-1 ${toneRing(tone)}
        transition
      `}
    >
      <div className="flex items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-black/30">
          {microIcon}
        </span>
        <div className="text-sm font-semibold text-slate-100">{label}</div>
      </div>

      <div className="mt-1 flex items-center gap-2">
        <X className="h-4 w-4 text-slate-400" />
        <div className="text-[11px] text-slate-400">{sublabel}</div>
      </div>

      {/* Subtle sheen */}
      <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
        <span className="absolute -left-1/3 top-0 h-full w-1/2 rotate-12 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </span>
    </button>
  );
}

function shortWallet(addr: string) {
  if (!addr || addr.length < 8) return addr;
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}
