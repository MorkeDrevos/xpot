// app/hub/DashboardClient.tsx
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { WalletReadyState } from '@solana/wallet-adapter-base';

import { SignIn, useClerk, useUser, SignOutButton } from '@clerk/nextjs';

import XpotPageShell from '@/components/XpotPageShell';
import { REQUIRED_XPOT } from '@/lib/xpot';

import {
  CheckCircle2,
  Copy,
  History,
  LogOut,
  ShieldCheck,
  Sparkles,
  Ticket,
  Wallet,
  X,
  Lock,
  ArrowRight,
} from 'lucide-react';

// ─────────────────────────────────────────────
// Small UI helpers
// ─────────────────────────────────────────────

const BTN_PRIMARY =
  'inline-flex items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 text-black font-semibold shadow-md hover:brightness-105 transition disabled:cursor-not-allowed disabled:opacity-40';

const BTN_UTILITY =
  'inline-flex items-center justify-center rounded-full border border-slate-700 text-slate-300 hover:bg-slate-800 transition disabled:cursor-not-allowed disabled:opacity-40';

function WalletMenuInline() {
  const { setVisible } = useWalletModal();

  return (
    <button
      type="button"
      onClick={() => setVisible(true)}
      className="text-left leading-tight hover:opacity-90"
    >
      <div className="text-[28px] font-medium text-slate-100">Select Wallet</div>
      <div className="text-[28px] font-medium text-slate-100">Change wallet</div>
    </button>
  );
}

function formatDate(date: string | Date) {
  const d = new Date(date);
  return d.toLocaleDateString('de-DE');
}

function formatDateTime(date: string | Date) {
  const d = new Date(date);
  return d.toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function shortWallet(addr: string) {
  if (!addr || addr.length < 8) return addr;
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

function StatusPill({
  children,
  tone = 'slate',
}: {
  children: React.ReactNode;
  tone?: 'slate' | 'emerald' | 'amber' | 'sky';
}) {
  const cls =
    tone === 'emerald'
      ? 'bg-emerald-500/10 text-emerald-300'
      : tone === 'amber'
      ? 'bg-amber-500/10 text-amber-200'
      : tone === 'sky'
      ? 'bg-sky-500/10 text-sky-200'
      : 'bg-slate-800/70 text-slate-200';

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${cls}`}
    >
      {children}
    </span>
  );
}

// Debug logger for wallet state
function WalletDebug() {
  const { publicKey, connected, wallet } = useWallet();

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('[XPOT] Wallet state changed:', {
      connected,
      publicKey: publicKey?.toBase58() ?? null,
      walletName: wallet?.adapter?.name ?? null,
    });
  }, [connected, publicKey, wallet]);

  return null;
}

// Optional UX helper: show hint under wallet button
function WalletStatusHint() {
  const { wallets, connected } = useWallet();

  const anyDetected = wallets.some(
    w =>
      w.readyState === WalletReadyState.Installed ||
      w.readyState === WalletReadyState.Loadable,
  );

  if (connected) return null;

  if (!anyDetected) {
    return (
      <p className="mt-2 text-xs text-amber-300">
        No Solana wallet detected. Install Phantom or Jupiter to continue.
      </p>
    );
  }

  return (
    <p className="mt-2 text-xs text-slate-500">
      Click “Select Wallet” and choose Phantom or Jupiter to connect.
    </p>
  );
}

async function safeCopy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type EntryStatus = 'in-draw' | 'expired' | 'not-picked' | 'won' | 'claimed';

type Entry = {
  id: string;
  code: string;
  status: EntryStatus;
  label?: string;
  jackpotUsd?: string | number;
  createdAt: string;
  walletAddress: string;
};

type RecentWinner = {
  id: string;
  drawDate: string;
  ticketCode: string;
  jackpotUsd: number;
  walletAddress: string;
  handle?: string | null;
};

// ─────────────────────────────────────────────
// Premium lock overlay (Sign-in + require X)
// ─────────────────────────────────────────────

function PremiumAuthLock({
  mode,
  onLinkX,
}: {
  mode: 'signin' | 'link-x';
  onLinkX: () => void;
}) {
  const title = mode === 'signin' ? 'Sign in to XPOT' : 'Link X to continue';
  const subtitle =
    mode === 'signin'
      ? 'XPOT Hub is private. Sign in with X to unlock your holder dashboard.'
      : 'Your account is signed in, but X is not linked. Link X to enter XPOT draws.';

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="XPOT access lock"
    >
      {/* Backdrop - shows blurred hub behind */}
      <div className="absolute inset-0 bg-black/55 backdrop-blur-xl" />

      {/* Soft premium glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background:
            'radial-gradient(900px 520px at 20% 20%, rgba(56,189,248,0.18), transparent 60%), radial-gradient(900px 520px at 80% 30%, rgba(168,85,247,0.22), transparent 60%), radial-gradient(900px 520px at 60% 90%, rgba(245,158,11,0.14), transparent 62%)',
        }}
      />

      {/* Card */}
      <div className="relative w-full max-w-[980px] overflow-hidden rounded-[34px] border border-white/10 bg-[#070812]/80 shadow-[0_40px_120px_rgba(0,0,0,0.75)]">
        {/* Header bar */}
        <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-white/[0.03] px-6 py-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/40">
              <Lock className="h-5 w-5 text-slate-200" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-100">
                {title}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>
            </div>
          </div>

          <span className="hidden rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-200 sm:inline-flex">
            HOLDER ACCESS
          </span>
        </div>

        {/* Body */}
        <div className="grid gap-6 p-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          {/* Left: narrative + perks */}
          <div className="rounded-[28px] border border-white/10 bg-black/35 p-6">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-300/90">
              XPOT HUB
            </p>

            <h2 className="mt-3 text-[28px] font-semibold tracking-tight text-slate-50">
              One identity. One wallet. One daily draw.
            </h2>

            <p className="mt-3 text-sm text-slate-300/85">
              Your XPOT access is bound to your X identity and your connected Solana wallet.
              This keeps the draw fair and the experience clean.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                  Security
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-100">
                  X + Wallet gated
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Keeps Hub private and prevents fake entries.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                  Experience
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-100">
                  Premium holder UI
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Wallet status, eligibility, tickets, history.
                </p>
              </div>
            </div>

            {mode === 'link-x' ? (
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={onLinkX}
                  className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-slate-200"
                >
                  Open account settings
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>

                <p className="text-xs text-slate-400">
                  In Clerk, connect your X account, then come back.
                </p>
              </div>
            ) : (
              <p className="mt-6 text-xs text-slate-400">
                Tip: If you don’t see X as an option, check your Clerk OAuth settings for X/Twitter.
              </p>
            )}
          </div>

          {/* Right: embedded Clerk */}
          <div className="rounded-[28px] border border-white/10 bg-black/35 p-4">
            {mode === 'signin' ? (
              <SignIn
                routing="path"
                path="/sign-in"
                appearance={{
                  variables: {
                    colorPrimary: '#fbbf24',
                    colorBackground: '#0b0c14',
                    colorText: '#e5e7eb',
                    borderRadius: '18px',
                  },
                  elements: {
                    card: 'shadow-none border border-white/10 bg-black/40',
                    headerTitle: 'text-slate-100',
                    headerSubtitle: 'text-slate-400',
                    socialButtonsBlockButton:
                      'rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/[0.07]',
                    formButtonPrimary:
                      'rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 text-black font-semibold hover:brightness-105',
                    footerActionLink: 'text-amber-300 hover:text-amber-200',
                  },
                }}
              />
            ) : (
              <div className="p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/40">
                    <X className="h-5 w-5 text-slate-200" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-100">
                      X account required
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      Link X to unlock draw entry and holder identity.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onLinkX}
                  className="mt-5 w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-slate-200"
                >
                  Link X now
                </button>

                <p className="mt-3 text-xs text-slate-400">
                  After linking, refresh this page.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom hairline */}
        <div className="relative h-[1px] w-full overflow-hidden">
          <div className="absolute left-1/2 top-0 h-full w-[72%] -translate-x-1/2 bg-[linear-gradient(90deg,rgba(56,189,248,0.08)_0%,rgba(168,85,247,0.18)_35%,rgba(245,158,11,0.18)_65%,rgba(56,189,248,0.08)_100%)] opacity-90" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Page (CLIENT)
// ─────────────────────────────────────────────

export default function DashboardClient() {
  // Today entries (global)
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [ticketsError, setTicketsError] = useState<string | null>(null);

  // Claim state
  const [ticketClaimed, setTicketClaimed] = useState(false);
  const [todaysTicket, setTodaysTicket] = useState<Entry | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  // Wallet
  const { publicKey, connected } = useWallet();
  const walletConnected = !!publicKey && connected;
  const currentWalletAddress = publicKey?.toBase58() ?? null;

  // XPOT balance
  const [xpotBalance, setXpotBalance] = useState<number | null | 'error'>(null);
  const hasRequiredXpot =
    typeof xpotBalance === 'number' && xpotBalance >= REQUIRED_XPOT;

  // History (wallet specific)
  const [historyEntries, setHistoryEntries] = useState<Entry[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Recent winners (global)
  const [recentWinners, setRecentWinners] = useState<RecentWinner[]>([]);
  const [loadingWinners, setLoadingWinners] = useState(false);
  const [winnersError, setWinnersError] = useState<string | null>(null);

  // Clerk user (X identity)
  const { user, isLoaded: isUserLoaded } = useUser();
  const { openUserProfile } = useClerk();
  const isSignedIn = !!user;

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
        p.includes('x')
      );
    }) || null;

  const handle = xAccount?.username || xAccount?.screenName || null;
  const avatar = xAccount?.imageUrl || user?.imageUrl || null;
  const name = user?.fullName || handle || 'XPOT user';

  // Hard “visual lock”: require sign-in + X linked
  const isAuthedEnough = isUserLoaded && isSignedIn && !!handle;
  const showLock =
    isUserLoaded && (!isSignedIn || (isSignedIn && !handle));

  // Prevent scrolling while lock is shown (feels premium, avoids jank)
  useEffect(() => {
    if (!showLock) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showLock]);

  // ─────────────────────────────────────────────
  // Sync X identity into DB whenever user is loaded
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!isUserLoaded || !user) return;

    (async () => {
      try {
        await fetch('/api/me/sync-x', { method: 'POST' });
      } catch (e) {
        console.error('[XPOT] Failed to sync X identity', e);
      }
    })();
  }, [isUserLoaded, user]);

  // ─────────────────────────────────────────────
  // Wire wallet → DB whenever it connects
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!isUserLoaded || !user) return;
    if (!publicKey || !connected) return;

    const address = publicKey.toBase58();

    (async () => {
      try {
        await fetch('/api/me/wallet-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address }),
        });
      } catch (e) {
        console.error('[XPOT] Failed to sync wallet', e);
      }
    })();
  }, [isUserLoaded, user, publicKey, connected]);

  // ─────────────────────────────────────────────
  // Load today's tickets from DB
  // ─────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function loadTickets() {
      setLoadingTickets(true);
      setTicketsError(null);

      try {
        const res = await fetch('/api/tickets/today', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to load tickets');

        const data = await res.json();
        if (!cancelled) {
          const list: Entry[] = Array.isArray(data.tickets) ? data.tickets : [];
          setEntries(list);
        }
      } catch (err) {
        console.error('Failed to load tickets from DB', err);
        if (!cancelled) {
          setTicketsError((err as Error).message ?? 'Failed to load tickets');
        }
      } finally {
        if (!cancelled) setLoadingTickets(false);
      }
    }

    loadTickets();
    return () => {
      cancelled = true;
    };
  }, []);

  // ─────────────────────────────────────────────
  // Sync "today's ticket" state with DB
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!currentWalletAddress) {
      setTicketClaimed(false);
      setTodaysTicket(null);
      return;
    }

    const myTicket = entries.find(
      t => t.walletAddress === currentWalletAddress && t.status === 'in-draw',
    );

    if (myTicket) {
      setTicketClaimed(true);
      setTodaysTicket(myTicket);
    } else {
      setTicketClaimed(false);
      setTodaysTicket(null);
    }
  }, [entries, currentWalletAddress]);

  // ─────────────────────────────────────────────
  // XPOT balance (via API route)
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!publicKey) {
      setXpotBalance(null);
      return;
    }

    let cancelled = false;
    setXpotBalance(null);

    (async () => {
      try {
        const res = await fetch(
          `/api/xpot-balance?address=${publicKey.toBase58()}`,
          { cache: 'no-store' },
        );
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const data: { balance: number } = await res.json();
        if (cancelled) return;
        setXpotBalance(data.balance);
      } catch (err) {
        console.error('Error loading XPOT balance (via API)', err);
        if (!cancelled) setXpotBalance('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [publicKey]);

  // ─────────────────────────────────────────────
  // Load wallet-specific draw history
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!publicKey) {
      setHistoryEntries([]);
      setHistoryError(null);
      return;
    }

    let cancelled = false;
    setLoadingHistory(true);
    setHistoryError(null);

    (async () => {
      try {
        const res = await fetch(
          `/api/tickets/history?wallet=${publicKey.toBase58()}`,
          { cache: 'no-store' },
        );
        if (!res.ok) throw new Error('Failed to load history');

        const data = await res.json();
        if (cancelled) return;

        if (Array.isArray(data.tickets)) {
          setHistoryEntries(
            data.tickets.map((t: any) => ({
              id: t.id,
              code: t.code,
              status: t.status as EntryStatus,
              label: t.label ?? '',
              jackpotUsd: t.jackpotUsd ?? 0,
              createdAt: t.createdAt,
              walletAddress: t.walletAddress,
            })),
          );
        } else {
          setHistoryEntries([]);
        }
      } catch (err) {
        console.error('Failed to load history', err);
        if (!cancelled) {
          setHistoryError((err as Error).message ?? 'Failed to load history');
        }
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [publicKey]);

  // ─────────────────────────────────────────────
  // Load recent winners (global)
  // ─────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoadingWinners(true);
    setWinnersError(null);

    (async () => {
      try {
        const res = await fetch('/api/winners/recent?limit=5', {
          cache: 'no-store',
        });
        if (!res.ok) throw new Error('Failed to load recent winners');

        const data = await res.json();
        if (cancelled) return;

        if (Array.isArray(data.winners)) {
          setRecentWinners(
            data.winners.map((w: any) => ({
              id: w.id,
              drawDate: w.drawDate,
              ticketCode: w.ticketCode,
              jackpotUsd: w.jackpotUsd ?? 0,
              walletAddress: w.walletAddress,
              handle: w.handle ?? null,
            })),
          );
        } else {
          setRecentWinners([]);
        }
      } catch (err) {
        console.error('Failed to load recent winners', err);
        if (!cancelled) {
          setWinnersError(
            (err as Error).message ?? 'Failed to load recent winners',
          );
        }
      } finally {
        if (!cancelled) setLoadingWinners(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // ─────────────────────────────────────────────
  // Ticket actions
  // ─────────────────────────────────────────────

  async function handleCopyCode(entry: Entry) {
    const ok = await safeCopy(entry.code);
    if (!ok) return;
    setCopiedId(entry.id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  async function handleClaimTicket() {
    if (!walletConnected || !publicKey) return;
    if (loadingTickets || claiming) return;

    setClaimError(null);
    setClaiming(true);

    const walletAddress = publicKey.toBase58();

    try {
      const res = await fetch('/api/tickets/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress }),
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }

      if (!res.ok || !data.ok) {
        const code = data.error as string | undefined;

        switch (code) {
          case 'NOT_ENOUGH_XPOT':
            setClaimError(
              `You need at least ${(data.required ?? REQUIRED_XPOT).toLocaleString()} XPOT to get today’s ticket. Your wallet currently has ${Number(
                data.balance ?? 0,
              ).toLocaleString()} XPOT.`,
            );
            break;

          case 'NOT_ENOUGH_SOL':
            setClaimError(
              'Your wallet needs some SOL for network fees before you can get today’s ticket.',
            );
            break;

          case 'XPOT_CHECK_FAILED':
            setClaimError(
              'Could not verify your XPOT balance right now. Please try again in a moment.',
            );
            break;

          case 'MISSING_WALLET':
          case 'INVALID_BODY':
            setClaimError(
              'Something is wrong with your wallet address. Try reconnecting your wallet and trying again.',
            );
            break;

          default:
            setClaimError('Ticket request failed. Please try again.');
        }

        console.error('Claim failed', res.status, text);
        return;
      }

      const ticket: Entry = data.ticket;
      const tickets: Entry[] | undefined = data.tickets;

      if (Array.isArray(tickets) && tickets.length > 0) {
        setEntries(tickets);
      } else if (ticket) {
        setEntries(prev => {
          const others = prev.filter(t => t.id !== ticket.id);
          return [ticket, ...others];
        });
      }

      setTicketClaimed(true);
      setTodaysTicket(ticket);
      setClaimError(null);
    } catch (err) {
      console.error('Error calling /api/tickets/claim', err);
      setClaimError('Unexpected error while getting your ticket. Please try again.');
    } finally {
      setClaiming(false);
    }
  }

  // Derived helpers
  const normalizedWallet = currentWalletAddress?.toLowerCase();
  const myTickets: Entry[] = useMemo(() => {
    if (!normalizedWallet) return [];
    return entries.filter(
      e => e.walletAddress?.toLowerCase() === normalizedWallet,
    );
  }, [entries, normalizedWallet]);

  const winner = entries.find(e => e.status === 'won') || null;
  const iWonToday =
    !!winner &&
    !!normalizedWallet &&
    winner.walletAddress?.toLowerCase() === normalizedWallet;

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────

  return (
    <>
      {/* Always render the hub UI, but lock it visually until authed + X linked */}
      <div className={showLock ? 'pointer-events-none select-none blur-[2px]' : ''}>
        <XpotPageShell
          topBarProps={{
            pillText: 'HOLDER DASHBOARD',
            rightSlot: (
              <div className="flex items-center gap-3">
                <Link
                  href="/hub/history"
                  className={`${BTN_UTILITY} h-10 px-4 text-xs`}
                >
                  <History className="mr-2 h-4 w-4" />
                  <span className="ml-1">History</span>
                </Link>

                <div className="rounded-full border border-slate-700/80 bg-slate-950/50 px-4 py-2">
                  <WalletMenuInline />
                  <WalletStatusHint />
                </div>

                {isSignedIn ? (
                  <SignOutButton redirectUrl="/">
                    <button className={`${BTN_UTILITY} h-10 px-4 text-xs`}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span className="ml-1">Log out</span>
                    </button>
                  </SignOutButton>
                ) : (
                  <Link href="/sign-in" className={`${BTN_UTILITY} h-10 px-4 text-xs`}>
                    <span>Sign in</span>
                  </Link>
                )}
              </div>
            ),
          }}
        >
          <WalletDebug />

          {/* MAIN GRID */}
          <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            {/* LEFT COLUMN */}
            <div className="space-y-4">
              {/* IDENTITY CARD */}
              <section className="rounded-[30px] border border-slate-900/70 bg-slate-950/60 px-5 py-5 backdrop-blur-xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-100">
                      Connected identity
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Wallet + X identity used for XPOT draws
                    </p>
                  </div>

                  <StatusPill tone={handle ? 'emerald' : 'amber'}>
                    <X className="h-3.5 w-3.5" />
                    {handle ? `@${handle}` : 'X not linked'}
                  </StatusPill>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                      XPOT balance
                    </p>
                    <p className="mt-1 font-mono text-sm text-slate-100">
                      {xpotBalance === null
                        ? 'Checking…'
                        : xpotBalance === 'error'
                        ? 'Unavailable'
                        : `${Math.floor(xpotBalance).toLocaleString()} XPOT`}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                      Eligibility
                    </p>
                    <div className="mt-1">
                      {typeof xpotBalance === 'number' ? (
                        hasRequiredXpot ? (
                          <StatusPill tone="emerald">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Eligible
                          </StatusPill>
                        ) : (
                          <StatusPill tone="amber">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Not eligible
                          </StatusPill>
                        )
                      ) : (
                        <StatusPill tone="slate">—</StatusPill>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                      Wallet
                    </p>
                    <p className="mt-1 font-mono text-sm text-slate-100">
                      {currentWalletAddress
                        ? shortWallet(currentWalletAddress)
                        : 'Not connected'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  {avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatar}
                      alt={name}
                      className="h-9 w-9 rounded-full border border-slate-800 object-cover"
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-800 bg-slate-900 text-slate-300">
                      <X className="h-4 w-4" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-100">
                      {name}
                    </p>
                    <p className="text-xs text-slate-500">
                      Holding requirement: {REQUIRED_XPOT.toLocaleString()} XPOT
                    </p>
                  </div>
                </div>
              </section>

              {/* TODAY TICKET */}
              <section className="rounded-[30px] border border-slate-900/70 bg-slate-950/60 px-5 py-5 backdrop-blur-xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-100">
                      Today’s XPOT
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Claim a free entry if your wallet holds the minimum XPOT.
                    </p>
                  </div>

                  <StatusPill tone={ticketClaimed ? 'emerald' : 'slate'}>
                    <Ticket className="h-3.5 w-3.5" />
                    {ticketClaimed ? 'Entry claimed' : 'Not claimed'}
                  </StatusPill>
                </div>

                {!walletConnected && (
                  <div className="mt-4 rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-3 text-xs text-slate-400">
                    Connect your wallet to check eligibility and claim today’s ticket.
                  </div>
                )}

                {walletConnected && !ticketClaimed && (
                  <>
                    <button
                      type="button"
                      onClick={handleClaimTicket}
                      disabled={!walletConnected || claiming}
                      className={`${BTN_PRIMARY} mt-4 px-6 py-3 text-sm`}
                    >
                      {claiming ? 'Generating…' : 'Get today’s ticket'}
                    </button>

                    {claimError && (
                      <p className="mt-3 text-xs text-amber-300">{claimError}</p>
                    )}

                    {typeof xpotBalance === 'number' && !hasRequiredXpot && (
                      <p className="mt-3 text-xs text-slate-500">
                        Your wallet is below the minimum. You need{' '}
                        <span className="font-semibold text-slate-200">
                          {REQUIRED_XPOT.toLocaleString()} XPOT
                        </span>{' '}
                        to claim today’s entry.
                      </p>
                    )}
                  </>
                )}

                {walletConnected && ticketClaimed && todaysTicket && (
                  <div className="mt-4 rounded-2xl border border-slate-800/80 bg-slate-950/80 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                      Your ticket code
                    </p>

                    <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
                      <p className="font-mono text-base text-slate-100">
                        {todaysTicket.code}
                      </p>

                      <button
                        type="button"
                        onClick={() => handleCopyCode(todaysTicket)}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-950/70 px-4 py-2 text-xs text-slate-200 hover:bg-slate-900/70"
                      >
                        <Copy className="h-4 w-4" />
                        {copiedId === todaysTicket.id ? 'Copied' : 'Copy'}
                      </button>
                    </div>

                    <p className="mt-2 text-xs text-slate-500">
                      Status:{' '}
                      <span className="font-semibold text-slate-200">IN DRAW</span>
                      {' · '}Issued {formatDateTime(todaysTicket.createdAt)}
                    </p>
                  </div>
                )}

                {walletConnected && ticketClaimed && !todaysTicket && (
                  <p className="mt-4 text-xs text-slate-500">
                    Your wallet has an entry today, but it hasn’t loaded yet. Refresh the page.
                  </p>
                )}

                {iWonToday && (
                  <div className="mt-4 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                    You won today’s XPOT. Check your wallet and the winners feed.
                  </div>
                )}
              </section>

              {/* TODAY ENTRIES (your wallet only) */}
              {walletConnected && (
                <section className="rounded-[30px] border border-slate-900/70 bg-slate-950/60 px-5 py-5 backdrop-blur-xl">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-100">
                        Your entries today
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Entries tied to your connected wallet.
                      </p>
                    </div>
                    <StatusPill tone="sky">
                      <Wallet className="h-3.5 w-3.5" />
                      {myTickets.length}
                    </StatusPill>
                  </div>

                  <div className="mt-4 space-y-2">
                    {loadingTickets ? (
                      <p className="text-xs text-slate-500">Loading…</p>
                    ) : ticketsError ? (
                      <p className="text-xs text-amber-300">{ticketsError}</p>
                    ) : myTickets.length === 0 ? (
                      <p className="text-xs text-slate-500">No entries yet.</p>
                    ) : (
                      myTickets.map(t => (
                        <div
                          key={t.id}
                          className="rounded-2xl border border-slate-800/80 bg-slate-950/70 px-4 py-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-mono text-sm text-slate-100">{t.code}</p>
                            <StatusPill
                              tone={
                                t.status === 'in-draw'
                                  ? 'emerald'
                                  : t.status === 'won'
                                  ? 'sky'
                                  : 'slate'
                              }
                            >
                              {t.status.replace('-', ' ')}
                            </StatusPill>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            Issued {formatDateTime(t.createdAt)}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              )}
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-4">
              {/* RECENT WINNERS */}
              <section className="rounded-[30px] border border-slate-900/70 bg-slate-950/60 px-5 py-5 backdrop-blur-xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-100">
                      Recent winners
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Latest completed draws across all holders.
                    </p>
                  </div>
                  <StatusPill tone="emerald">
                    <Sparkles className="h-3.5 w-3.5" />
                    Live
                  </StatusPill>
                </div>

                <div className="mt-4 space-y-2">
                  {loadingWinners ? (
                    <p className="text-xs text-slate-500">Loading…</p>
                  ) : winnersError ? (
                    <p className="text-xs text-amber-300">{winnersError}</p>
                  ) : recentWinners.length === 0 ? (
                    <p className="text-xs text-slate-500">No completed draws yet.</p>
                  ) : (
                    recentWinners.map(w => (
                      <div
                        key={w.id}
                        className="rounded-2xl border border-slate-800/80 bg-slate-950/70 px-4 py-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs text-slate-400">
                            {formatDate(w.drawDate)}
                          </p>
                          {w.handle ? (
                            <StatusPill tone="sky">
                              <X className="h-3.5 w-3.5" />
                              @{w.handle.replace(/^@/, '')}
                            </StatusPill>
                          ) : (
                            <StatusPill tone="slate">wallet</StatusPill>
                          )}
                        </div>

                        <p className="mt-1 font-mono text-sm text-slate-100">
                          {w.ticketCode}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {shortWallet(w.walletAddress)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* WALLET HISTORY (quick view) */}
              <section className="rounded-[30px] border border-slate-900/70 bg-slate-950/60 px-5 py-5 backdrop-blur-xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-100">
                      Your draw history
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Past entries for this wallet (wins, not-picked, expired).
                    </p>
                  </div>

                  <Link href="/hub/history" className={`${BTN_UTILITY} h-9 px-4 text-xs`}>
                    View all
                  </Link>
                </div>

                <div className="mt-4 space-y-2">
                  {!walletConnected ? (
                    <p className="text-xs text-slate-500">
                      Connect your wallet to view history.
                    </p>
                  ) : loadingHistory ? (
                    <p className="text-xs text-slate-500">Loading…</p>
                  ) : historyError ? (
                    <p className="text-xs text-amber-300">{historyError}</p>
                  ) : historyEntries.length === 0 ? (
                    <p className="text-xs text-slate-500">No history yet.</p>
                  ) : (
                    historyEntries.slice(0, 5).map(t => (
                      <div
                        key={t.id}
                        className="rounded-2xl border border-slate-800/80 bg-slate-950/70 px-4 py-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-mono text-sm text-slate-100">{t.code}</p>
                          <StatusPill
                            tone={
                              t.status === 'won'
                                ? 'sky'
                                : t.status === 'claimed'
                                ? 'emerald'
                                : t.status === 'in-draw'
                                ? 'emerald'
                                : 'slate'
                            }
                          >
                            {t.status.replace('-', ' ')}
                          </StatusPill>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatDateTime(t.createdAt)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </section>

          {/* FOOTER */}
          <footer className="mt-8 border-t border-slate-800/70 pt-4 text-xs text-slate-500">
            <span className="inline-flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-slate-400" />
              XPOT is in Pre-Launch Mode. UI is final, wiring continues.
            </span>
          </footer>
        </XpotPageShell>
      </div>

      {/* Premium auth lock overlay */}
      {showLock ? (
        <PremiumAuthLock
          mode={!isSignedIn ? 'signin' : 'link-x'}
          onLinkX={() => openUserProfile?.()}
        />
      ) : null}

      {/* Safety: if authed enough, ensure UI is interactive (no leftover state) */}
      {!showLock && isAuthedEnough ? null : null}
    </>
  );
}
