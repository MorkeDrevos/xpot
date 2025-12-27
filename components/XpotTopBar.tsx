// components/XpotTopBar.tsx
'use client';

import Link from 'next/link';
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { createPortal } from 'react-dom';

import XpotLogo from '@/components/XpotLogo';

import { useUser, SignOutButton } from '@clerk/nextjs';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletReadyState, type WalletName } from '@solana/wallet-adapter-base';

import {
  ChevronDown,
  ExternalLink,
  LogOut,
  Menu,
  PieChart,
  Radio,
  Trophy,
  Wallet,
  Map,
  X,
  Crown,
  Ticket,
  Copy,
  Check,
  ShieldCheck,
  XCircle,
  Loader2,
  ChevronRight,
  Info,
  Hourglass,
} from 'lucide-react';

type HubWalletTone = 'slate' | 'emerald' | 'amber' | 'sky';

export type HubWalletStatus = {
  label: string;
  sublabel?: string;
  tone?: HubWalletTone;
  claimed?: boolean;
  winner?: boolean;
};

export type XpotTopBarProps = {
  logoHref?: string;

  // Public pill (non-hub pages)
  pillText?: string;

  // Optional right slogan (non-hub pages)
  sloganRight?: string;

  // Escape hatch (non-hub pages only)
  rightSlot?: ReactNode;

  // Hub enhancements
  hubWalletStatus?: HubWalletStatus;

  /**
   * Optional external wallet modal opener (if you want to use a different modal).
   * If not provided, XpotTopBar will use its own light popup.
   */
  onOpenWalletModal?: () => void;

  liveIsOpen?: boolean;

  // Banner
  hasBanner?: boolean;
  maxWidthClassName?: string;
};

const XPOT_X_POST = 'https://x.com/xpotbet';

// ✅ Correct route (your file is app/2045/final-day/page.tsx)
const FINAL_DAY_HREF = '/2045/final-day';

// ✅ Naming (pick one and keep it consistent everywhere)
const FINAL_DAY_LABEL = 'Final Draw'; // alternatives: 'Finale' | 'Legacy' | 'Archive'

// Shared routes
const WINNERS_HREF = '/winners';
const TOKENOMICS_HREF = '/tokenomics';
const ROADMAP_HREF = '/roadmap';
const MECHANISM_HREF = '/mechanism';
const PROTOCOL_HREF = '/hub/protocol';

// ✅ Your real deployed CA
const XPOT_OFFICIAL_CA = 'FYeJCZvfzwUcFLq7mr82zJFu8qvoJ3kQB3W1kd1Ejko1';

export default function XpotTopBar({
  logoHref = '/',
  pillText = 'THE X-POWERED REWARD PROTOCOL',
  sloganRight,
  rightSlot,
  hubWalletStatus,
  onOpenWalletModal,
  liveIsOpen = false,
  hasBanner = true,
  maxWidthClassName = 'max-w-[1440px]',
}: XpotTopBarProps) {
  const pathname = usePathname() || '';
  const isHub = pathname === '/hub' || pathname.startsWith('/hub/');

  const [mobileOpen, setMobileOpen] = useState(false);
  const [learnOpen, setLearnOpen] = useState(false);

  // ✅ Internal light wallet popup (only used if onOpenWalletModal not provided)
  const [lightWalletOpen, setLightWalletOpen] = useState(false);
  const openWallet = useMemo(() => {
    return onOpenWalletModal ? onOpenWalletModal : () => setLightWalletOpen(true);
  }, [onOpenWalletModal]);

  const clerkEnabled = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const top = hasBanner ? 'calc(var(--xpot-banner-h, 0px) - 1px)' : '0px';

  const headerRef = useRef<HTMLElement | null>(null);

  // Close menus on route change
  useEffect(() => {
    setMobileOpen(false);
    setLearnOpen(false);
  }, [pathname]);

  // Close learn dropdown on escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setLearnOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ✅ Publish real topbar height to CSS var for perfect page offsets
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;

    const measure = () => {
      const el = headerRef.current;
      if (!el) return;
      const h = Math.ceil(el.getBoundingClientRect().height);
      if (h > 0) root.style.setProperty('--xpot-topbar-h', `${h}px`);
    };

    measure();
    const raf1 = window.requestAnimationFrame(measure);
    const raf2 = window.requestAnimationFrame(measure);

    window.addEventListener('resize', measure);

    let ro: ResizeObserver | null = null;
    if ('ResizeObserver' in window) {
      ro = new ResizeObserver(() => measure());
      if (headerRef.current) ro.observe(headerRef.current);
    }

    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
      window.removeEventListener('resize', measure);
      if (ro) ro.disconnect();
    };
  }, [pathname, hasBanner]);

  return (
    <>
      <header ref={headerRef} className="fixed inset-x-0 z-[60] w-full" style={{ top }}>
        {/* Topbar block ABOVE the divider so dropdown always wins stacking */}
        <div className="relative z-[80] border-b border-white/5 bg-black/70 backdrop-blur-md">
          <div className={`mx-auto w-full ${maxWidthClassName} px-4 sm:px-6`}>
            <div className="flex min-h-[104px] items-center gap-4">
              {/* LEFT: Logo + optional pill */}
              <div className="flex min-w-0 items-center gap-4">
                <Link href={logoHref} className="flex shrink-0 items-center gap-3">
                  <XpotLogo
                    variant="light"
                    width={460}
                    height={120}
                    priority
                    className="h-[92px] max-h-[92px] w-auto object-contain animate-[xpotStarFlash_20s_ease-in-out_infinite]"
                  />
                </Link>

                {/* Optional pill/slogan (public only) */}
                {!isHub && (
                  <div className="hidden min-w-0 items-center gap-3 lg:flex">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-[11px] font-semibold tracking-wide text-slate-300">
                      <span className="h-2 w-2 rounded-full bg-slate-300/70 shadow-[0_0_10px_rgba(148,163,184,0.35)]" />
                      <span className="truncate opacity-85">{pillText}</span>
                    </span>

                    {sloganRight && (
                      <span className="hidden items-center rounded-full border border-white/10 bg-white/[0.035] px-4 py-1.5 text-[11px] font-semibold tracking-wide text-slate-200 2xl:inline-flex">
                        {sloganRight}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* CENTER: Nav (desktop) */}
              <div className="hidden flex-1 items-center justify-center gap-8 xl:flex">
                {isHub ? (
                  <HubNavCenter liveIsOpen={liveIsOpen} />
                ) : (
                  <PublicNavCenter liveIsOpen={liveIsOpen} learnOpen={learnOpen} setLearnOpen={setLearnOpen} />
                )}
              </div>

              {/* RIGHT: Actions */}
              <div className="ml-auto flex items-center gap-3">
                {!isHub && (
                  <div className="hidden xl:flex">
                    <OfficialCAChip />
                  </div>
                )}

                {isHub ? (
                  <HubRight
                    clerkEnabled={clerkEnabled}
                    hubWalletStatus={hubWalletStatus}
                    onOpenWalletModal={openWallet}
                  />
                ) : (
                  <>{rightSlot ? rightSlot : <PublicRight />}</>
                )}

                {/* Mobile menu button */}
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.06] xl:hidden"
                  onClick={() => setMobileOpen(true)}
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Premium divider - LOWER z so it never draws above dropdown */}
        <div className="relative z-[10] h-[1px] w-full overflow-hidden">
          <div className="absolute left-1/2 top-0 h-full w-[72%] -translate-x-1/2 bg-[linear-gradient(90deg,rgba(56,189,248,0.10),rgba(56,189,248,0.55),rgba(56,189,248,0.10))]" />
        </div>

        {/* Mobile drawer */}
        <MobileMenu
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          isHub={isHub}
          liveIsOpen={liveIsOpen}
          clerkEnabled={clerkEnabled}
          hubWalletStatus={hubWalletStatus}
          onOpenWalletModal={openWallet}
        />
      </header>

      {/* ✅ Light wallet popup (only used when parent does not supply onOpenWalletModal) */}
      {!onOpenWalletModal && (
        <LightConnectWalletModal open={lightWalletOpen} onClose={() => setLightWalletOpen(false)} />
      )}
    </>
  );
}

/* ---------------- OFFICIAL CA CHIP ---------------- */

function shortenAddress(addr: string, left = 6, right = 6) {
  if (!addr) return '';
  if (addr.length <= left + right + 3) return addr;
  return `${addr.slice(0, left)}…${addr.slice(-right)}`;
}

function OfficialCAChip() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const addrShort = useMemo(() => shortenAddress(XPOT_OFFICIAL_CA, 6, 6), []);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(XPOT_OFFICIAL_CA);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1100);
    } catch {}
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="
          group relative inline-flex items-center gap-3
          rounded-full px-4 py-2
          border border-white/10 bg-white/[0.03]
          backdrop-blur-xl
          shadow-[0_18px_60px_rgba(0,0,0,0.55)]
          hover:bg-white/[0.055]
          transition
        "
        title="Status"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span aria-hidden className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-black/40" />

        <span
          className="
            relative z-10 inline-flex h-8 w-8 items-center justify-center
            rounded-full border border-emerald-400/15
            bg-[radial-gradient(circle_at_30%_30%,rgba(16,185,129,0.20),rgba(0,0,0,0.35))]
            shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_14px_40px_rgba(0,0,0,0.55)]
          "
        >
          <ShieldCheck className="h-4 w-4 text-emerald-200" />
        </span>

        <div className="relative z-10 hidden min-w-0 flex-col leading-none sm:flex">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-200/85">Status</span>
            <span className="inline-flex items-center rounded-full border border-emerald-400/15 bg-emerald-300/10 px-2 py-0.5 text-[10px] font-semibold tracking-[0.18em] text-emerald-100">
              VERIFIED
            </span>
          </div>

          <span className="mt-1 font-mono text-[12px] text-slate-100/90">{addrShort}</span>
        </div>

        <span className="relative z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-200/80 group-hover:bg-white/[0.07] group-hover:text-slate-100 transition">
          <ChevronDown className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[90] cursor-default"
            aria-label="Close status"
            onMouseDown={() => setOpen(false)}
          />

          <div className="absolute right-0 z-[91] mt-3 w-[360px] overflow-hidden rounded-2xl border border-white/10 bg-black/80 backdrop-blur-xl shadow-[0_30px_100px_rgba(0,0,0,0.65)]">
            <div className="p-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-[11px] font-semibold tracking-[0.30em] text-slate-300/80">OFFICIAL CONTRACT</p>
                <p className="mt-2 font-mono text-sm text-slate-100 break-all">{XPOT_OFFICIAL_CA}</p>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onCopy}
                    className="
                      inline-flex items-center gap-2 rounded-full
                      border border-white/10 bg-white/[0.04]
                      px-3 py-2 text-xs font-semibold text-slate-100
                      hover:bg-white/[0.07]
                    "
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 text-emerald-200" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 text-slate-100/90" />
                        Copy
                      </>
                    )}
                  </button>

                  <Link
                    href={PROTOCOL_HREF}
                    className="
                      ml-auto inline-flex items-center gap-2 rounded-full
                      border border-white/10 bg-white/[0.04]
                      px-3 py-2 text-xs font-semibold text-slate-100
                      hover:bg-white/[0.07]
                    "
                  >
                    <ShieldCheck className="h-4 w-4 text-emerald-300" />
                    Health
                  </Link>
                </div>
              </div>

              <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-xs text-slate-300/80">Verified contract and protocol status live in one place.</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------- Shared ---------------- */

function LiveDot({ isOpen }: { isOpen: boolean }) {
  return (
    <span className="relative inline-flex h-3 w-3 shrink-0 items-center justify-center">
      {isOpen ? (
        <>
          <span className="absolute inline-flex h-3 w-3 animate-ping rounded-full bg-emerald-400/60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
        </>
      ) : (
        <span className="inline-flex h-2 w-2 rounded-full bg-slate-500" />
      )}
    </span>
  );
}

function NavLink({
  href,
  children,
  className = '',
  title,
  external,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  title?: string;
  external?: boolean;
}) {
  const base =
    'inline-flex items-center gap-2 py-2 text-[13px] font-semibold leading-none text-slate-200/80 hover:text-white transition';
  return (
    <Link href={href} title={title} className={`${base} ${className}`} target={external ? '_blank' : undefined}>
      {children}
    </Link>
  );
}

function NavPill({
  href,
  children,
  title,
  external,
}: {
  href: string;
  children: ReactNode;
  title?: string;
  external?: boolean;
}) {
  return (
    <Link
      href={href}
      title={title}
      target={external ? '_blank' : undefined}
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 py-2.5 text-[13px] font-semibold text-slate-100 hover:bg-white/[0.06]"
    >
      {children}
    </Link>
  );
}

/* ---------------- Public: Center nav ---------------- */

function PublicNavCenter({
  liveIsOpen,
  learnOpen,
  setLearnOpen,
}: {
  liveIsOpen: boolean;
  learnOpen: boolean;
  setLearnOpen: (v: boolean) => void;
}) {
  const openT = useRef<number | null>(null);
  const closeT = useRef<number | null>(null);

  const openSoon = () => {
    if (closeT.current) window.clearTimeout(closeT.current);
    if (openT.current) window.clearTimeout(openT.current);
    openT.current = window.setTimeout(() => setLearnOpen(true), 70);
  };

  const closeSoon = () => {
    if (openT.current) window.clearTimeout(openT.current);
    if (closeT.current) window.clearTimeout(closeT.current);
    closeT.current = window.setTimeout(() => setLearnOpen(false), 90);
  };

  useEffect(() => {
    return () => {
      if (openT.current) window.clearTimeout(openT.current);
      if (closeT.current) window.clearTimeout(closeT.current);
    };
  }, []);

  return (
    <nav className="flex items-center gap-7">
      <NavLink href="/hub">Hub</NavLink>

      {/* Live */}
      <NavLink href={PROTOCOL_HREF} title="Protocol state" className="gap-2">
        <LiveDot isOpen={liveIsOpen} />
        <Radio className="h-[15px] w-[15px] text-emerald-300" />
        Live
      </NavLink>

      {/* Final Draw (primary) */}
      <NavPill href={FINAL_DAY_HREF} title={FINAL_DAY_LABEL}>
        <Hourglass className="h-[15px] w-[15px] text-amber-200" />
        <span className="tracking-wide">{FINAL_DAY_LABEL}</span>
      </NavPill>

      {/* Learn dropdown (hover + click) */}
      <div className="relative" onMouseEnter={openSoon} onMouseLeave={closeSoon}>
        <button
          type="button"
          onClick={() => setLearnOpen(!learnOpen)}
          className="inline-flex items-center gap-2 py-2 text-[13px] font-semibold leading-none text-slate-200/80 hover:text-white transition"
          aria-haspopup="menu"
          aria-expanded={learnOpen}
        >
          Learn
          <ChevronDown className={`h-4 w-4 transition ${learnOpen ? 'rotate-180' : ''}`} />
        </button>

        {learnOpen && (
          <>
            <button
              type="button"
              aria-label="Close learn menu"
              className="fixed inset-0 z-[90] cursor-default"
              onMouseDown={() => setLearnOpen(false)}
            />

            <div className="absolute left-1/2 z-[91] mt-3 w-[260px] -translate-x-1/2 overflow-hidden rounded-2xl border border-white/10 bg-black/80 backdrop-blur-xl shadow-[0_30px_100px_rgba(0,0,0,0.65)]">
              <div className="p-2">
                <Link
                  href={TOKENOMICS_HREF}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-100 hover:bg-white/[0.06]"
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
                    <PieChart className="h-4 w-4 text-emerald-300" />
                  </span>
                  Tokenomics
                </Link>

                <Link
                  href={ROADMAP_HREF}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-100 hover:bg-white/[0.06]"
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
                    <Map className="h-4 w-4 text-sky-300" />
                  </span>
                  Roadmap
                </Link>

                <Link
                  href={WINNERS_HREF}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-100 hover:bg-white/[0.06]"
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
                    <Trophy className="h-4 w-4 text-amber-300" />
                  </span>
                  Winners
                </Link>

                <Link
                  href={MECHANISM_HREF}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-100 hover:bg-white/[0.06]"
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
                    <Info className="h-4 w-4 text-slate-200" />
                  </span>
                  Mechanism
                </Link>

                <div className="my-2 h-px bg-white/10" />

                <Link
                  href={XPOT_X_POST}
                  target="_blank"
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-100 hover:bg-white/[0.06]"
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
                    <ExternalLink className="h-4 w-4 text-slate-200" />
                  </span>
                  Official X
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}

/* ---------------- Public: Right actions ---------------- */

function PublicRight() {
  return (
    <div className="hidden items-center gap-3 xl:flex">
      <Link
        href="/hub"
        className="
          rounded-full bg-white px-6 py-2.5
          text-[13px] font-semibold text-black
          hover:bg-slate-200
          shadow-[0_18px_60px_rgba(0,0,0,0.35)]
        "
      >
        Enter today&apos;s XPOT →
      </Link>
    </div>
  );
}

/* ---------------- Hub: Center nav ---------------- */

function HubNavCenter({ liveIsOpen }: { liveIsOpen: boolean }) {
  return (
    <nav className="flex items-center gap-7">
      <NavLink href="/hub">Hub</NavLink>

      {/* Live */}
      <NavLink href={PROTOCOL_HREF} title="Protocol state" className="gap-2">
        <LiveDot isOpen={liveIsOpen} />
        <Radio className="h-[15px] w-[15px] text-emerald-300" />
        Live
      </NavLink>

      {/* ✅ Final Draw (ONLY ONCE) */}
      <NavPill href={FINAL_DAY_HREF} title={FINAL_DAY_LABEL}>
        <Hourglass className="h-[15px] w-[15px] text-amber-200" />
        <span className="tracking-wide">{FINAL_DAY_LABEL}</span>
      </NavPill>

      <NavLink href={MECHANISM_HREF} title="How winners are picked">
        <Info className="h-4 w-4 text-slate-200" />
        Mechanism
      </NavLink>

      <NavLink href={TOKENOMICS_HREF}>
        <PieChart className="h-4 w-4 text-emerald-300" />
        Tokenomics
      </NavLink>

      <NavLink href={ROADMAP_HREF}>
        <Map className="h-4 w-4 text-sky-300" />
        Roadmap
      </NavLink>

      <NavLink href={WINNERS_HREF}>
        <Trophy className="h-4 w-4 text-amber-300" />
        Winners
      </NavLink>

      <NavLink href={XPOT_X_POST} external title="Official XPOT X">
        <ExternalLink className="h-4 w-4" />
        X
      </NavLink>
    </nav>
  );
}

/* ---------------- Hub: Right actions ---------------- */

function HubRight({
  clerkEnabled,
  hubWalletStatus,
  onOpenWalletModal,
}: {
  clerkEnabled: boolean;
  hubWalletStatus?: HubWalletStatus;
  onOpenWalletModal?: () => void;
}) {
  return (
    <div className="hidden items-center gap-3 xl:flex">
      <HubWalletMenuInline hubWalletStatus={hubWalletStatus} onOpenWalletModal={onOpenWalletModal} />

      {clerkEnabled && (
        <SignOutButton redirectUrl="/">
          <button className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 py-2.5 text-[13px] font-semibold text-slate-100 hover:bg-white/[0.06]">
            <LogOut className="h-5 w-5" />
            Log out
          </button>
        </SignOutButton>
      )}
    </div>
  );
}

/* ---------------- Wallet button (premium + royal) ---------------- */

function toneRing(tone: HubWalletTone) {
  if (tone === 'emerald') return 'ring-emerald-400/20';
  if (tone === 'amber') return 'ring-amber-400/20';
  if (tone === 'sky') return 'ring-sky-400/20';
  return 'ring-white/10';
}

function toneGlow(tone: HubWalletTone) {
  if (tone === 'emerald') return 'from-emerald-400/20 via-emerald-300/10 to-transparent';
  if (tone === 'amber') return 'from-amber-400/22 via-amber-300/10 to-transparent';
  if (tone === 'sky') return 'from-sky-400/22 via-violet-400/10 to-transparent';
  return 'from-white/12 via-white/8 to-transparent';
}

function HubWalletMenuInline({
  hubWalletStatus,
  onOpenWalletModal,
}: {
  hubWalletStatus?: HubWalletStatus;
  onOpenWalletModal?: () => void;
}) {
  const { publicKey, connected } = useWallet();
  const addr = connected && publicKey ? publicKey.toBase58() : null;

  const label = hubWalletStatus?.label ?? (connected ? 'Wallet linked' : 'Select wallet');
  const sublabel = hubWalletStatus?.sublabel ?? (addr ? shortWallet(addr) : 'Change wallet');

  const tone: HubWalletTone =
    hubWalletStatus?.winner ? 'sky' : hubWalletStatus?.claimed ? 'emerald' : connected ? 'sky' : 'amber';

  const microIcon = hubWalletStatus?.winner ? (
    <Crown className="h-4 w-4 text-amber-200" />
  ) : hubWalletStatus?.claimed ? (
    <Ticket className="h-4 w-4 text-emerald-200" />
  ) : (
    <Wallet className="h-4 w-4 text-slate-200" />
  );

  return (
    <button
      onClick={() => onOpenWalletModal?.()}
      className={`
        group relative overflow-hidden
        rounded-full
        border border-white/10
        px-5 py-2.5
        ring-1 ${toneRing(tone)}
        bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))]
        shadow-[0_18px_60px_rgba(0,0,0,0.55)]
        hover:brightness-[1.04]
        transition
      `}
      title={addr ?? undefined}
      type="button"
    >
      <span
        aria-hidden
        className={`
          pointer-events-none absolute inset-0 opacity-70
          bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.10),transparent_45%)]
        `}
      />
      <span
        aria-hidden
        className={`
          pointer-events-none absolute -left-10 top-0 h-full w-40
          bg-gradient-to-r ${toneGlow(tone)}
          blur-xl opacity-60
          group-hover:opacity-80
          transition
        `}
      />
      <span aria-hidden className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-black/35" />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.28),transparent)]"
      />

      <div className="relative flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/35 shadow-[0_10px_30px_rgba(0,0,0,0.55)]">
          {microIcon}
        </span>

        <div className="min-w-0 text-left">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-slate-100">{label}</span>

            {hubWalletStatus?.winner && (
              <span className="hidden sm:inline-flex items-center rounded-full border border-amber-400/15 bg-amber-300/10 px-2 py-0.5 text-[10px] font-semibold tracking-[0.18em] text-amber-100">
                WINNER
              </span>
            )}

            {hubWalletStatus?.claimed && !hubWalletStatus?.winner && (
              <span className="hidden sm:inline-flex items-center rounded-full border border-emerald-400/15 bg-emerald-300/10 px-2 py-0.5 text-[10px] font-semibold tracking-[0.18em] text-emerald-100">
                TICKET
              </span>
            )}
          </div>

          <div className="mt-0.5 flex items-center gap-2">
            <span className="text-[11px] text-slate-300/70">{sublabel}</span>
          </div>
        </div>

        <span className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-200/80 group-hover:bg-white/[0.07] group-hover:text-slate-100 transition">
          <ChevronRight className="h-4 w-4" />
        </span>
      </div>
    </button>
  );
}

function shortWallet(addr: string) {
  return addr ? `${addr.slice(0, 4)}…${addr.slice(-4)}` : '';
}

/* ---------------- ✅ Light connect wallet popup ---------------- */

function LightConnectWalletModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { wallets, select, connect, connecting, connected, disconnect, publicKey, wallet: activeWallet } = useWallet();

  const [mounted, setMounted] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [busyName, setBusyName] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;

    setAttempted(false);
    setErrorMsg(null);
    setBusyName(null);

    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const addr = connected && publicKey ? shortWallet(publicKey.toBase58()) : null;

  const usableWallets = useMemo(() => {
    return (wallets || []).filter((w) => w.readyState !== WalletReadyState.Unsupported);
  }, [wallets]);

  async function handlePick(name: WalletName) {
    try {
      if (connected && activeWallet?.adapter?.name === String(name)) {
        onClose();
        return;
      }

      setAttempted(true);
      setErrorMsg(null);
      setBusyName(String(name));

      select(name);
      await new Promise((r) => setTimeout(r, 50));
      await connect();

      setBusyName(null);
      setErrorMsg(null);
      onClose();
    } catch (e: any) {
      const msg =
        typeof e?.message === 'string' && e.message.trim()
          ? e.message
          : 'Could not connect wallet. Please try again.';
      setBusyName(null);
      setErrorMsg(msg);
    }
  }

  async function handleDisconnect() {
    try {
      await disconnect();
      onClose();
    } catch {
      onClose();
    }
  }

  if (!open || !mounted) return null;

  return createPortal(
    <>
      <button
        type="button"
        className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Close wallet dialog"
      />

      <div className="fixed left-1/2 top-1/2 z-[121] w-[92vw] max-w-[520px] -translate-x-1/2 -translate-y-1/2">
        <div
          className="
            relative overflow-hidden rounded-3xl
            border border-white/10
            bg-[radial-gradient(circle_at_15%_10%,rgba(255,255,255,0.10),rgba(255,255,255,0.03)_40%,rgba(0,0,0,0.55)_100%)]
            shadow-[0_40px_140px_rgba(0,0,0,0.75)]
            backdrop-blur-xl
          "
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,rgba(56,189,248,0.0),rgba(56,189,248,0.55),rgba(236,72,153,0.35),rgba(56,189,248,0.0))]" />

          <div className="flex items-start justify-between gap-4 px-6 pb-4 pt-6">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold tracking-[0.30em] text-slate-300/80">CONNECT WALLET</p>
              <h3 className="mt-2 text-lg font-semibold text-white">Select a wallet to enter XPOT</h3>
              <p className="mt-1 text-sm text-slate-300/80">Fast, simple, and clean. You can change it anytime.</p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.07]"
              aria-label="Close"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>

          <div className="px-6 pb-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-100">
                    {connected ? 'Wallet connected' : 'No wallet connected'}
                  </p>
                  <p className="mt-1 truncate text-xs text-slate-300/70">{connected ? addr : 'Choose a wallet below'}</p>
                </div>

                {connected && (
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-slate-100 hover:bg-white/[0.07]"
                  >
                    Disconnect
                  </button>
                )}
              </div>
            </div>

            {attempted && errorMsg && (
              <div className="mt-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {errorMsg}
              </div>
            )}

            <div className="mt-4 space-y-2">
              {usableWallets.map((w) => {
                const name = w.adapter.name as WalletName;
                const ready = w.readyState;
                const isInstalled = ready === WalletReadyState.Installed || ready === WalletReadyState.Loadable;
                const isActive = activeWallet?.adapter?.name === String(name);
                const isBusy = connecting && busyName === String(name);

                return (
                  <button
                    key={String(name)}
                    type="button"
                    onClick={() => handlePick(name)}
                    disabled={connecting}
                    className="
                      group w-full rounded-2xl border border-white/10
                      bg-white/[0.03] px-4 py-3
                      hover:bg-white/[0.06]
                      transition
                      disabled:opacity-60 disabled:cursor-not-allowed
                    "
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        {(w.adapter as any).icon ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={(w.adapter as any).icon}
                            alt={`${String(name)} icon`}
                            className="h-9 w-9 rounded-xl border border-white/10 bg-black/30"
                          />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/30">
                            <Wallet className="h-4 w-4 text-slate-200" />
                          </div>
                        )}

                        <div className="min-w-0 text-left">
                          <p className="truncate text-sm font-semibold text-slate-100">{String(name)}</p>
                          <p className="mt-0.5 text-xs text-slate-300/70">
                            {isActive && connected ? 'Active' : isInstalled ? 'Installed' : 'Available'}
                          </p>
                        </div>
                      </div>

                      <span
                        className="
                          inline-flex items-center gap-2 rounded-full
                          border border-white/10 bg-black/30
                          px-3 py-1.5 text-xs font-semibold text-slate-100
                          group-hover:bg-black/25
                        "
                      >
                        {isBusy ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Connecting
                          </>
                        ) : (
                          <>
                            Connect <span className="opacity-70">→</span>
                          </>
                        )}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <p className="text-xs text-slate-300/70">
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-300/90" />
                  Wallet connection is required for eligibility verification.
                </span>
              </p>

              {connecting && (
                <p className="inline-flex items-center gap-2 text-xs text-slate-300/70">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Waiting for wallet approval...
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}

/* ---------------- Mobile menu ---------------- */

function MobileMenu({
  open,
  onClose,
  isHub,
  liveIsOpen,
  clerkEnabled,
  hubWalletStatus,
  onOpenWalletModal,
}: {
  open: boolean;
  onClose: () => void;
  isHub: boolean;
  liveIsOpen: boolean;
  clerkEnabled: boolean;
  hubWalletStatus?: HubWalletStatus;
  onOpenWalletModal?: () => void;
}) {
  const { user, isLoaded } = useUser();
  const externalAccounts = (user?.externalAccounts || []) as any[];

  const xAccount = externalAccounts.find(
    (acc) =>
      String(acc.provider || '').toLowerCase().includes('twitter') ||
      String(acc.provider || '').toLowerCase().includes('x'),
  );

  const handle = xAccount?.username || xAccount?.screenName || null;
  const avatar = xAccount?.imageUrl || user?.imageUrl || null;
  const displayHandle = handle ? `@${handle.replace(/^@/, '')}` : null;
  const initial = (displayHandle || 'X')[1] || 'X';

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close menu"
      />
      <div className="fixed right-0 top-0 z-[81] h-full w-[92%] max-w-sm border-l border-white/10 bg-black/85 backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-3">
            {isLoaded && avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="X avatar" className="h-9 w-9 rounded-full border border-white/10" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-sm text-slate-200">
                {initial}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-100">Menu</p>
              <p className="truncate text-xs text-slate-400">{displayHandle ?? 'Guest'}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.06]"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-2 px-5 py-5">
          <Link
            className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-slate-100"
            href="/hub"
          >
            Hub
          </Link>

          {/* Live -> Protocol */}
          <Link
            className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-slate-100"
            href={PROTOCOL_HREF}
          >
            <span className="inline-flex items-center gap-2">
              <LiveDot isOpen={liveIsOpen} />
              Live
            </span>
            <Radio className="h-4 w-4 text-emerald-300" />
          </Link>

          <Link
            className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-slate-100"
            href={FINAL_DAY_HREF}
          >
            <span className="inline-flex items-center gap-2">
              <Hourglass className="h-4 w-4 text-amber-200" />
              {FINAL_DAY_LABEL}
            </span>
          </Link>

          <Link
            className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-slate-100"
            href={MECHANISM_HREF}
          >
            <span className="inline-flex items-center gap-2">
              <Info className="h-4 w-4 text-slate-200" />
              Mechanism
            </span>
          </Link>

          <Link
            className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-slate-100"
            href={TOKENOMICS_HREF}
          >
            <span className="inline-flex items-center gap-2">
              <PieChart className="h-4 w-4 text-emerald-300" />
              Tokenomics
            </span>
          </Link>

          <Link
            className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-slate-100"
            href={ROADMAP_HREF}
          >
            <span className="inline-flex items-center gap-2">
              <Map className="h-4 w-4 text-sky-300" />
              Roadmap
            </span>
          </Link>

          <Link
            className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-slate-100"
            href={WINNERS_HREF}
          >
            <span className="inline-flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-300" />
              Winners
            </span>
          </Link>

          <Link
            className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-slate-100"
            href={XPOT_X_POST}
            target="_blank"
          >
            <span className="inline-flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Official X
            </span>
          </Link>

          {isHub && (
            <div className="pt-2">
              <HubWalletMenuInline hubWalletStatus={hubWalletStatus} onOpenWalletModal={onOpenWalletModal} />
            </div>
          )}

          {isHub && clerkEnabled && (
            <div className="pt-2">
              <SignOutButton redirectUrl="/">
                <button className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-slate-100 hover:bg-white/[0.06]">
                  <span className="inline-flex items-center gap-2">
                    <LogOut className="h-5 w-5" />
                    Log out
                  </span>
                </button>
              </SignOutButton>
            </div>
          )}

          <div className="pt-3">
            <Link
              href="/hub"
              className="block rounded-2xl bg-white px-4 py-3 text-center text-sm font-semibold text-black hover:bg-slate-200"
            >
              Enter today&apos;s XPOT →
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
