// components/XpotTopBar.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ReactNode, useEffect, useRef, useState, useMemo } from 'react';
import { usePathname } from 'next/navigation';

import { useUser, SignOutButton } from '@clerk/nextjs';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

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
} from 'lucide-react';

type HubWalletTone = 'slate' | 'emerald' | 'amber' | 'sky';

export type HubWalletStatus = {
  label: string;
  sublabel?: string;
  tone?: HubWalletTone;
  claimed?: boolean;
  winner?: boolean;
};

type XpotTopBarProps = {
  logoHref?: string;

  // Public pill (non-hub pages)
  pillText?: string;

  // Optional right slogan (non-hub pages)
  sloganRight?: string;

  // Escape hatch (non-hub pages only)
  rightSlot?: ReactNode;

  // Hub enhancements
  hubWalletStatus?: HubWalletStatus;
  onOpenWalletModal?: () => void;
  liveIsOpen?: boolean;

  // Banner
  hasBanner?: boolean;
  maxWidthClassName?: string;
};

const XPOT_X_POST = 'https://x.com/xpotbet';

const WINNERS_HREF = '/winners';
const TOKENOMICS_HREF = '/tokenomics';
const ROADMAP_HREF = '/roadmap';

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
    <header ref={headerRef} className="fixed inset-x-0 z-[60] w-full" style={{ top }}>
      <div className="border-b border-white/5 bg-black/70 backdrop-blur-md">
        <div className={`mx-auto w-full ${maxWidthClassName} px-4 sm:px-6`}>
          <div className="flex min-h-[104px] items-center gap-4">
            {/* LEFT: Logo + optional pill */}
            <div className="flex min-w-0 items-center gap-4">
              <Link href={logoHref} className="flex shrink-0 items-center gap-3">
                <Image
                  src="/img/xpot-logo-light.png"
                  alt="XPOT"
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
                <PublicNavCenter
                  liveIsOpen={liveIsOpen}
                  learnOpen={learnOpen}
                  setLearnOpen={setLearnOpen}
                />
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
                  onOpenWalletModal={onOpenWalletModal}
                />
              ) : (
                <>{rightSlot ? rightSlot : <PublicRight liveIsOpen={liveIsOpen} />}</>
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

      {/* Premium divider */}
      <div className="relative h-[1px] w-full overflow-hidden">
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
        onOpenWalletModal={onOpenWalletModal}
      />
    </header>
  );
}

/* ---------------- OFFICIAL CA CHIP (wide, low, no yellow tick) ---------------- */

function shortenAddress(addr: string, left = 6, right = 6) {
  if (!addr) return '';
  if (addr.length <= left + right + 3) return addr;
  return `${addr.slice(0, left)}…${addr.slice(-right)}`;
}

function OfficialCAChip() {
  const [copied, setCopied] = useState(false);

  const addrShort = useMemo(() => shortenAddress(XPOT_OFFICIAL_CA, 6, 6), []);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(XPOT_OFFICIAL_CA);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1100);
    } catch {
      // ignore
    }
  }

  return (
    <div
      className="
        relative inline-flex items-center gap-3
        rounded-full
        px-4 py-1.5
        border border-white/10
        bg-white/[0.03]
        backdrop-blur-xl
        shadow-[0_18px_60px_rgba(0,0,0,0.55)]
      "
      title={XPOT_OFFICIAL_CA}
    >
      {/* Dark edge highlight (prevents “white rim” look) */}
      <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-black/40" />

      {/* Seal */}
      <span
        className="
          relative z-10 inline-flex h-8 w-8 items-center justify-center
          rounded-full
          border border-emerald-400/15
          bg-[radial-gradient(circle_at_30%_30%,rgba(16,185,129,0.18),rgba(0,0,0,0.35))]
          shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_14px_40px_rgba(0,0,0,0.55)]
        "
      >
        <ShieldCheck className="h-4 w-4 text-emerald-200" />
      </span>

      {/* Label + CA */}
      <div className="relative z-10 flex flex-col leading-none pr-1">
        <span className="text-[10px] font-semibold uppercase tracking-[0.30em] text-emerald-200/90">
          OFFICIAL CA
        </span>
        <span className="mt-1 font-mono text-[12px] text-slate-100/95">
          {addrShort}
        </span>
      </div>

      {/* Between CA + copy: new subtle “verified capsule” instead of a divider line */}
      <span
        className="
          relative z-10 inline-flex items-center
          rounded-full border border-white/10
          bg-black/30 px-2.5 py-1
          text-[10px] font-semibold uppercase tracking-[0.22em]
          text-slate-200/80
        "
      >
        VERIFIED
      </span>

      {/* Copy */}
      <button
        type="button"
        onClick={onCopy}
        className="
          relative z-10 inline-flex items-center justify-center
          h-8 w-8 rounded-full
          border border-white/10
          bg-white/[0.04]
          hover:bg-white/[0.07]
        "
        aria-label="Copy official CA"
        title="Copy official CA"
      >
        {copied ? <Check className="h-4 w-4 text-emerald-200" /> : <Copy className="h-4 w-4 text-slate-100/90" />}
      </button>
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
    'inline-flex items-center gap-2 text-[13px] font-semibold text-slate-200/80 hover:text-white transition';
  return (
    <Link
      href={href}
      title={title}
      className={`${base} ${className}`}
      target={external ? '_blank' : undefined}
    >
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
  return (
    <nav className="flex items-center gap-7">
      <NavLink href="/hub">Hub</NavLink>

      <NavLink href="/hub/live" title={liveIsOpen ? 'Live draw is open' : 'Live view'}>
        <LiveDot isOpen={liveIsOpen} />
        <Radio className="h-4 w-4 text-emerald-300" />
        Live
      </NavLink>

      {/* Learn dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setLearnOpen(!learnOpen)}
          className="inline-flex items-center gap-2 text-[13px] font-semibold text-slate-200/80 hover:text-white transition"
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
              aria-label="Close"
              className="fixed inset-0 z-[60] cursor-default"
              onClick={() => setLearnOpen(false)}
            />
            <div className="absolute left-1/2 z-[61] mt-3 w-[260px] -translate-x-1/2 overflow-hidden rounded-2xl border border-white/10 bg-black/80 backdrop-blur-xl shadow-[0_30px_100px_rgba(0,0,0,0.65)]">
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

function PublicRight({ liveIsOpen }: { liveIsOpen: boolean }) {
  return (
    <div className="hidden items-center gap-3 xl:flex">
      <NavPill href="/hub/live" title={liveIsOpen ? 'Live draw is open' : 'Live view'}>
        <LiveDot isOpen={liveIsOpen} />
        <Radio className="h-4 w-4 text-emerald-300" />
        Live
      </NavPill>

      <Link
        href="/hub"
        className="rounded-full bg-white px-5 py-2.5 text-[13px] font-semibold text-black hover:bg-slate-200"
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

      <NavLink href="/hub/live" title={liveIsOpen ? 'Live draw is open' : 'Live view'}>
        <LiveDot isOpen={liveIsOpen} />
        <Radio className="h-4 w-4 text-emerald-300" />
        Live
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

/* ---------------- Wallet ---------------- */

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

  const label = hubWalletStatus?.label ?? (connected ? 'Wallet linked' : 'Select wallet');
  const sublabel = hubWalletStatus?.sublabel ?? (addr ? shortWallet(addr) : 'Change wallet');

  const tone: HubWalletTone =
    hubWalletStatus?.winner ? 'sky' : hubWalletStatus?.claimed ? 'emerald' : connected ? 'sky' : 'amber';

  const microIcon = hubWalletStatus?.winner ? (
    <Crown className="h-4 w-4" />
  ) : hubWalletStatus?.claimed ? (
    <Ticket className="h-4 w-4" />
  ) : (
    <Wallet className="h-4 w-4" />
  );

  const open = () => (onOpenWalletModal ? onOpenWalletModal() : setVisible(true));

  return (
    <button
      onClick={open}
      className={`group rounded-full border border-white/10 px-5 py-2.5 ring-1 ${toneRing(tone)} hover:opacity-95`}
      title={addr ?? undefined}
    >
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-black/30">
          {microIcon}
        </span>
        <span className="text-[13px] font-semibold">{label}</span>
      </div>
      <div className="mt-1 text-[11px] text-slate-400">{sublabel}</div>
    </button>
  );
}

function shortWallet(addr: string) {
  return addr ? `${addr.slice(0, 4)}…${addr.slice(-4)}` : '';
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
          <Link className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-slate-100" href="/hub">
            Hub
          </Link>

          <Link className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-slate-100" href="/hub/live">
            <span className="inline-flex items-center gap-2">
              <LiveDot isOpen={liveIsOpen} />
              Live
            </span>
            <Radio className="h-4 w-4 text-emerald-300" />
          </Link>

          <Link className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-slate-100" href={TOKENOMICS_HREF}>
            <span className="inline-flex items-center gap-2">
              <PieChart className="h-4 w-4 text-emerald-300" />
              Tokenomics
            </span>
          </Link>

          <Link className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-slate-100" href={ROADMAP_HREF}>
            <span className="inline-flex items-center gap-2">
              <Map className="h-4 w-4 text-sky-300" />
              Roadmap
            </span>
          </Link>

          <Link className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-slate-100" href={WINNERS_HREF}>
            <span className="inline-flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-300" />
              Winners
            </span>
          </Link>

          <Link className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-slate-100" href={XPOT_X_POST} target="_blank">
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
            <Link href="/hub" className="block rounded-2xl bg-white px-4 py-3 text-center text-sm font-semibold text-black hover:bg-slate-200">
              Enter today&apos;s XPOT →
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
