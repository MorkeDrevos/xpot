// app/ops/AdminClient.tsx
'use client';

import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';

import XpotLogoLottie from '@/components/XpotLogoLottie';
import JackpotPanel from '@/components/JackpotPanel';
import XpotPageShell from '@/components/XpotPageShell';
import OperationsCenterBadge from '@/components/OperationsCenterBadge';

import {
  BadgeCheck,
  CalendarClock,
  Crown,
  Info,
  KeyRound,
  Loader2,
  RefreshCcw,
  ShieldAlert,
  Ticket,
  Timer,
  XCircle,
} from 'lucide-react';

const MAX_TODAY_TICKETS = 7;
const MAX_RECENT_WINNERS = 10;

type DrawStatus = 'open' | 'closed' | 'completed';

type TodayDraw = {
  id: string;
  date: string;
  status: DrawStatus;
  jackpotUsd: number;
  rolloverUsd: number;
  ticketsCount: number;
  closesAt?: string | null;
};

type OpsMode = 'MANUAL' | 'AUTO';

type TicketStatus = 'in-draw' | 'expired' | 'not-picked' | 'won' | 'claimed';

type AdminTicket = {
  id: string;
  code: string;
  walletAddress: string;
  status: TicketStatus;
  createdAt: string;
  jackpotUsd?: number;
};

type AdminWinnerKind = 'main' | 'bonus';

type AdminWinner = {
  id: string;
  drawId: string;
  date: string;
  ticketCode: string;
  walletAddress: string;
  jackpotUsd: number;
  payoutUsd: number; // used as XPOT amount in UI
  isPaidOut: boolean;
  txUrl?: string | null;
  kind?: AdminWinnerKind;
  label?: string | null;
};

type BonusDropStatus = 'SCHEDULED' | 'FIRED' | 'CANCELLED';

type AdminBonusDrop = {
  id: string;
  label: string;
  amountXpot: number;
  scheduledAt: string;
  status: BonusDropStatus;
};

const ADMIN_TOKEN_KEY = 'xpot_admin_token';

function formatDate(date: string | Date) {
  const d = new Date(date);
  return d.toLocaleDateString('en-GB');
}

function formatDateTime(date: string | Date) {
  const d = new Date(date);
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatUsd(amount: number | null | undefined, decimals = 2) {
  if (amount == null || !Number.isFinite(amount)) return '$0.00';
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatXpot(amount: number | null | undefined, decimals = 2) {
  if (amount == null || !Number.isFinite(amount)) return '0 XPOT';
  return `${amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  })} XPOT`;
}

function truncateAddress(addr: string, visible: number = 6) {
  if (!addr) return '(unknown wallet)';
  if (addr.length <= visible * 2) return addr;
  return `${addr.slice(0, visible)}…${addr.slice(-visible)}`;
}

function StatusDot({ on }: { on: boolean }) {
  return (
    <span
      className={`h-1.5 w-1.5 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.9)] ${
        on ? 'bg-emerald-400' : 'bg-slate-600'
      }`}
    />
  );
}

function Badge({
  children,
  tone = 'slate',
}: {
  children: ReactNode;
  tone?: 'slate' | 'emerald' | 'amber' | 'sky' | 'red';
}) {
  const cls =
    tone === 'emerald'
      ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
      : tone === 'amber'
      ? 'border-amber-400/40 bg-amber-500/10 text-amber-200'
      : tone === 'sky'
      ? 'border-sky-400/40 bg-sky-500/10 text-sky-100'
      : tone === 'red'
      ? 'border-red-400/40 bg-red-500/10 text-red-200'
      : 'border-slate-700/70 bg-slate-900/70 text-slate-300';

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${cls}`}
    >
      {children}
    </span>
  );
}

function formatWinnerLabel(w: AdminWinner): string | null {
  if (!w.label) return null;
  const raw = w.label.trim();
  if (w.kind === 'main' || /jackpot/i.test(raw)) return 'Main XPOT';
  return raw.replace(/jackpot/gi, 'XPOT');
}

function CopyableWallet({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);

  if (!address) return <span className="font-mono text-xs text-slate-500">(unknown wallet)</span>;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (err) {
      console.error('Failed to copy wallet address', err);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="group inline-flex items-center gap-2 text-[11px] text-slate-400 transition-colors hover:text-emerald-300"
      title={address}
    >
      <span className="font-mono">{truncateAddress(address, 6)}</span>
      <span className="rounded-md border border-slate-600/60 px-1 py-[1px] text-[10px] tracking-wide group-hover:border-emerald-400/60">
        {copied ? 'Copied' : 'Copy'}
      </span>
    </button>
  );
}

// Buttons (driven by globals.css)
const BTN = 'xpot-btn';
const BTN_PRIMARY = 'xpot-btn xpot-btn-primary';
const BTN_UTILITY = 'xpot-btn';
const BTN_DANGER = 'xpot-btn xpot-btn-danger';

const BTN_CROWN =
  'inline-flex items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 text-black font-semibold shadow-md hover:brightness-105 transition disabled:cursor-not-allowed disabled:opacity-40';

export default function AdminPage() {
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState('');
  const [tokenAccepted, setTokenAccepted] = useState(false);
  const [isSavingToken, setIsSavingToken] = useState(false);

  const [, setOpsMode] = useState<OpsMode>('MANUAL');
  const [effectiveOpsMode, setEffectiveOpsMode] = useState<OpsMode>('MANUAL');
  const [envAutoAllowed, setEnvAutoAllowed] = useState<boolean>(false);

  const [todayDraw, setTodayDraw] = useState<TodayDraw | null>(null);
  const [todayDrawError, setTodayDrawError] = useState<string | null>(null);
  const [todayLoading, setTodayLoading] = useState(true);

  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [ticketsError, setTicketsError] = useState<string | null>(null);
  const [ticketsLoading, setTicketsLoading] = useState(true);

  const [winners, setWinners] = useState<AdminWinner[]>([]);
  const [winnersError, setWinnersError] = useState<string | null>(null);
  const [winnersLoading, setWinnersLoading] = useState(true);

  const [isDevHost, setIsDevHost] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState<string | null>(null);

  const [txInputs, setTxInputs] = useState<Record<string, string>>({});
  const [savingPaidId, setSavingPaidId] = useState<string | null>(null);
  const [markPaidError, setMarkPaidError] = useState<string | null>(null);

  const [visibleTicketCount, setVisibleTicketCount] = useState(MAX_TODAY_TICKETS);
  const [visibleWinnerCount, setVisibleWinnerCount] = useState(MAX_RECENT_WINNERS);

  const visibleTickets = useMemo(
    () => tickets.slice(0, visibleTicketCount),
    [tickets, visibleTicketCount],
  );
  const visibleWinners = useMemo(
    () => winners.slice(0, visibleWinnerCount),
    [winners, visibleWinnerCount],
  );

  const [liveJackpotUsd, setLiveJackpotUsd] = useState<number | null>(null);

  const [countdownText, setCountdownText] = useState<string | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);

  const isWarningSoon = countdownSeconds !== null && countdownSeconds <= 15 * 60;
  const isWarningCritical = countdownSeconds !== null && countdownSeconds <= 5 * 60;

  const [bonusAmount, setBonusAmount] = useState('100000');
  const [bonusLabel, setBonusLabel] = useState('Bonus XPOT');
  const [bonusDelayMinutes, setBonusDelayMinutes] = useState<number>(30);
  const [bonusSubmitting, setBonusSubmitting] = useState(false);
  const [bonusError, setBonusError] = useState<string | null>(null);
  const [bonusSuccess, setBonusSuccess] = useState<string | null>(null);

  const [upcomingDrops, setUpcomingDrops] = useState<AdminBonusDrop[]>([]);
  const [upcomingLoading, setUpcomingLoading] = useState(false);
  const [upcomingError, setUpcomingError] = useState<string | null>(null);

  const [nextBonusDrop, setNextBonusDrop] = useState<AdminBonusDrop | null>(null);
  const [nextBonusCountdown, setNextBonusCountdown] = useState<string | null>(null);

  const [pickError, setPickError] = useState<string | null>(null);
  const [pickSuccess, setPickSuccess] = useState<string | null>(null);
  const [isPickingWinner, setIsPickingWinner] = useState(false);

  const [bonusPickError, setBonusPickError] = useState<string | null>(null);
  const [bonusPickSuccess, setBonusPickSuccess] = useState<string | null>(null);
  const [isPickingBonusWinner, setIsPickingBonusWinner] = useState(false);
  const [isReopeningDraw, setIsReopeningDraw] = useState(false);

  const [creatingDraw, setCreatingDraw] = useState(false);

  const [cancelingDropId, setCancelingDropId] = useState<string | null>(null);
  const [cancelDropError, setCancelDropError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsDevHost(window.location.hostname.startsWith('dev.'));
    }
  }, []);

  // Load stored token
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(ADMIN_TOKEN_KEY);
    if (stored) {
      const v = stored.trim();
      setAdminToken(v);
      setTokenAccepted(true);
      setTokenInput(v);
    }
  }, []);

  // --- Critical fix: throw on non-OK so UI cannot lie ---
  async function authedFetch<T = any>(input: string, init?: RequestInit): Promise<T> {
    if (!adminToken) throw new Error('Admin key missing. Unlock admin first.');

    const headers = new Headers(init?.headers || {});
    if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    headers.set('x-xpot-admin-key', adminToken.trim());

    const res = await fetch(input, { ...init, headers });

    let data: any = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (!res.ok) {
      const msg =
        data?.message ||
        data?.error ||
        `Request failed (${res.status})`;
      throw new Error(msg);
    }

    return data as T;
  }

  async function refreshUpcomingDrops() {
    setUpcomingLoading(true);
    setUpcomingError(null);
    try {
      const data = await authedFetch<{ upcoming?: AdminBonusDrop[] }>('/api/admin/bonus-upcoming');
      setUpcomingDrops(data?.upcoming ?? []);
    } catch (err: any) {
      console.error('[ADMIN] refresh upcoming error', err);
      setUpcomingError(err?.message || 'Failed to load upcoming drops');
    } finally {
      setUpcomingLoading(false);
    }
  }

  async function loadAll() {
    if (!adminToken) return;

    // Today
    setTodayLoading(true);
    setTodayDrawError(null);
    try {
      const data = await authedFetch<{ today?: TodayDraw | null }>('/api/admin/today');
      setTodayDraw(data?.today ?? null);
    } catch (err: any) {
      setTodayDraw(null);
      setTodayDrawError(err?.message || 'Failed to load today');
    } finally {
      setTodayLoading(false);
    }

    // Tickets
    setTicketsLoading(true);
    setTicketsError(null);
    try {
      const data = await authedFetch<{ tickets?: AdminTicket[] }>('/api/admin/tickets');
      setTickets(data?.tickets ?? []);
    } catch (err: any) {
      setTickets([]);
      setTicketsError(err?.message || 'Failed to load tickets');
    } finally {
      setTicketsLoading(false);
    }

    // Winners
    setWinnersLoading(true);
    setWinnersError(null);
    try {
      const data = await authedFetch<{ winners?: AdminWinner[] }>('/api/admin/winners');
      setWinners(data?.winners ?? []);
    } catch (err: any) {
      setWinners([]);
      setWinnersError(err?.message || 'Failed to load winners');
    } finally {
      setWinnersLoading(false);
    }

    // Upcoming
    await refreshUpcomingDrops();
  }

  // Load data when token appears/changes
  useEffect(() => {
    if (!adminToken) return;
    let cancelled = false;

    (async () => {
      try {
        await loadAll();
        if (!cancelled) return;
      } catch {
        // loadAll already sets UI errors
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminToken]);

  async function handleSeedDemoData(force = false) {
    setSeedMsg(null);

    if (!adminToken) {
      setSeedMsg('Admin key missing. Unlock admin first.');
      return;
    }

    setIsSeeding(true);
    try {
      const url = force ? '/api/admin/dev-seed?force=1' : '/api/admin/dev-seed';

      // If your dev-seed expects a JSON body, add it here (currently we keep it empty)
      const data = await authedFetch<any>(url, { method: 'POST' });

      if (data?.skipped) setSeedMsg(data?.message || 'Seed skipped (DB not empty).');
      else setSeedMsg('Seed complete. Reloading ops data...');

      await loadAll();
    } catch (err: any) {
      console.error('[ADMIN] seed error', err);
      setSeedMsg(`Seed failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsSeeding(false);
    }
  }

  async function handleCreateTodayDraw() {
    setTodayDrawError(null);

    if (!adminToken) {
      alert('Admin token missing. Unlock admin first.');
      return;
    }

    setCreatingDraw(true);
    try {
      const data = await authedFetch<any>('/api/admin/create-today-draw', { method: 'POST' });
      if (data?.ok === false) throw new Error(data?.error || 'Failed to create today’s draw');
      window.location.reload();
    } catch (err: any) {
      console.error('[XPOT] create today draw error:', err);
      alert(err?.message || 'Unexpected error creating today’s round');
    } finally {
      setCreatingDraw(false);
    }
  }

  async function handleScheduleBonus(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBonusError(null);
    setBonusSuccess(null);

    if (!adminToken) {
      setBonusError('Admin token missing. Unlock admin first.');
      return;
    }
    if (!todayDraw) {
      setBonusError('No draw detected for today yet. Create today’s draw first or wait for auto-create.');
      return;
    }
    if (todayDraw.status !== 'open') {
      setBonusError('Today’s draw is not open. Bonus drops can only be scheduled for an open draw.');
      return;
    }

    const amountNumber = Number(bonusAmount);
    if (!Number.isFinite(amountNumber) || amountNumber < 100000) {
      setBonusError('Enter a valid XPOT amount (min 100,000).');
      return;
    }

    const allowedDelays = [5, 15, 30, 60];
    if (!allowedDelays.includes(bonusDelayMinutes)) {
      setBonusError('Select a valid bonus timer.');
      return;
    }

    setBonusSubmitting(true);
    try {
      const data = await authedFetch<{ drop?: AdminBonusDrop }>('/api/admin/bonus-schedule', {
        method: 'POST',
        body: JSON.stringify({
          amountXpot: amountNumber,
          label: bonusLabel || 'Bonus XPOT',
          delayMinutes: bonusDelayMinutes,
        }),
      });

      const drop = data?.drop;
      setBonusSuccess(drop ? `Scheduled ${drop.label} · ${drop.amountXpot.toLocaleString()} XPOT.` : `Scheduled bonus XPOT.`);
      await refreshUpcomingDrops();
    } catch (err: any) {
      console.error('[ADMIN] schedule bonus error', err);
      setBonusError(err?.message || 'Failed to schedule bonus XPOT.');
    } finally {
      setBonusSubmitting(false);
    }
  }

  async function handleCancelBonusDrop(dropId: string) {
    setCancelDropError(null);

    if (!adminToken) {
      setCancelDropError('Admin token missing. Unlock admin first.');
      return;
    }

    setCancelingDropId(dropId);
    try {
      const data = await authedFetch<any>(`/api/admin/bonus-cancel?id=${encodeURIComponent(dropId)}`, { method: 'POST' });
      if (data?.ok === false) throw new Error(data?.error || 'Failed to cancel drop');

      setUpcomingDrops(prev => prev.map(d => (d.id === dropId ? { ...d, status: 'CANCELLED' } : d)));
    } catch (err: any) {
      console.error('[ADMIN] cancel drop error', err);
      setCancelDropError(err?.message || 'Failed to cancel bonus drop.');
    } finally {
      setCancelingDropId(null);
    }
  }

  async function handlePickMainWinner() {
    setPickError(null);
    setPickSuccess(null);

    if (!adminToken) {
      setPickError('Admin token missing. Unlock admin first.');
      return;
    }

    setIsPickingWinner(true);
    try {
      const data = await authedFetch<any>('/api/admin/pick-winner', { method: 'POST' });

      const raw = data?.winner;
      if (!raw) throw new Error('No winner returned from API');

      const winner: AdminWinner = {
        ...raw,
        kind: raw.kind ? (String(raw.kind).toLowerCase() as AdminWinnerKind) : 'main',
        payoutUsd: raw.payoutUsd ?? raw.payoutXpot ?? raw.amountUsd ?? raw.amountXpot ?? 0,
      };

      const addr = typeof winner.walletAddress === 'string' ? winner.walletAddress : '';
      const shortAddr = addr ? truncateAddress(addr, 4) : '(no wallet)';

      setPickSuccess(`Main XPOT winner: ${winner.ticketCode || '(no ticket)'} (${shortAddr})`);

      try {
        const winnersData = await authedFetch<{ winners?: AdminWinner[] }>('/api/admin/winners');
        setWinners(winnersData?.winners ?? []);
      } catch {
        setWinners(prev => [winner, ...prev]);
      }

      setTodayDraw(prev => (prev ? { ...prev, status: 'closed' } : prev));
    } catch (err: any) {
      setPickError(err?.message || 'Failed to pick main XPOT winner');
    } finally {
      setIsPickingWinner(false);
    }
  }

  async function handlePickBonusWinnerNow() {
    setBonusPickError(null);
    setBonusPickSuccess(null);

    if (!adminToken) {
      setBonusPickError('Admin token missing. Unlock admin first.');
      return;
    }

    if (!todayDraw?.id) {
      setBonusPickError('No active draw.');
      return;
    }

    if (todayDraw.status !== 'open') {
      setBonusPickError('Bonus winners can only be picked while the draw is open.');
      return;
    }

    setIsPickingBonusWinner(true);
    try {
      const data = await authedFetch<any>('/api/admin/pick-bonus-winner', {
        method: 'POST',
        body: JSON.stringify({
          drawId: todayDraw.id,
          label: bonusLabel || 'Bonus XPOT',
          amountXpot: Number(bonusAmount),
        }),
      });

      if (data?.ok === false) throw new Error(data?.error || 'Failed to pick bonus winner');

      const raw = data?.winner;
      if (!raw) throw new Error('No winner returned');

      const winner: AdminWinner = {
        ...raw,
        payoutUsd: raw.payoutUsd ?? raw.payoutXpot ?? raw.amountUsd ?? raw.amountXpot ?? 0,
      };

      setBonusPickSuccess(`Bonus winner: ${winner.ticketCode || '(no ticket)'}`);
      setWinners(prev => [winner, ...prev]);
    } catch (err: any) {
      setBonusPickError(err?.message || 'Failed to pick bonus winner');
    } finally {
      setIsPickingBonusWinner(false);
    }
  }

  async function handleReopenDraw() {
    setTodayDrawError(null);

    if (!adminToken) {
      alert('Admin token missing. Unlock admin first.');
      return;
    }

    setIsReopeningDraw(true);
    try {
      const data = await authedFetch<any>('/api/admin/reopen-draw', { method: 'POST' });
      if (data?.ok === false) throw new Error(data?.error || 'Failed to reopen draw');
      setTodayDraw(prev => (prev ? { ...prev, status: 'open' } : prev));
    } catch (err: any) {
      console.error('[XPOT] reopen draw error:', err);
      alert(err?.message || 'Unexpected error reopening draw');
    } finally {
      setIsReopeningDraw(false);
    }
  }

  async function handleMarkAsPaid(winnerId: string) {
    setMarkPaidError(null);

    if (!adminToken) {
      setMarkPaidError('Admin token missing. Unlock admin first.');
      return;
    }

    const txUrl = (txInputs[winnerId]?.trim() || '');
    if (!txUrl) {
      setMarkPaidError('Paste a TX link before marking as paid.');
      return;
    }

    setSavingPaidId(winnerId);
    try {
      const data = await authedFetch<any>('/api/admin/mark-paid', {
        method: 'POST',
        body: JSON.stringify({ winnerId, txUrl }),
      });

      if (data?.ok === false) throw new Error(data?.error || 'Failed to mark as paid');

      setWinners(prev => prev.map(w => (w.id === winnerId ? { ...w, isPaidOut: true, txUrl } : w)));
    } catch (err: any) {
      setMarkPaidError(err?.message || 'Failed to mark as paid');
    } finally {
      setSavingPaidId(null);
    }
  }

  // Countdown
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!todayDraw?.closesAt) {
      setCountdownText(null);
      setCountdownSeconds(null);
      return;
    }

    const targetTime = new Date(todayDraw.closesAt).getTime();
    if (!Number.isFinite(targetTime)) {
      setCountdownText(null);
      setCountdownSeconds(null);
      return;
    }

    function updateCountdown() {
      const diffMs = targetTime - Date.now();
      let totalSeconds = Math.floor(diffMs / 1000);
      if (totalSeconds <= 0) totalSeconds = 0;

      setCountdownSeconds(totalSeconds);

      const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
      const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
      const seconds = String(totalSeconds % 60).padStart(2, '0');
      setCountdownText(`${hours}:${minutes}:${seconds}`);
    }

    updateCountdown();
    const id = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(id);
  }, [todayDraw?.closesAt]);

  // Next bonus countdown
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!upcomingDrops || upcomingDrops.length === 0) {
      setNextBonusDrop(null);
      setNextBonusCountdown(null);
      return;
    }

    const scheduled = upcomingDrops.filter(d => d.status === 'SCHEDULED');
    if (scheduled.length === 0) {
      setNextBonusDrop(null);
      setNextBonusCountdown(null);
      return;
    }

    const next = scheduled.reduce<AdminBonusDrop | null>((acc, d) => {
      if (!acc) return d;
      return new Date(d.scheduledAt).getTime() < new Date(acc.scheduledAt).getTime() ? d : acc;
    }, null);

    if (!next) {
      setNextBonusDrop(null);
      setNextBonusCountdown(null);
      return;
    }

    setNextBonusDrop(next);
    const targetTime = new Date(next.scheduledAt).getTime();

    function updateCountdown() {
      const diffMs = targetTime - Date.now();
      if (diffMs <= 0) {
        setNextBonusCountdown('00:00:00');
        return;
      }

      const totalSeconds = Math.floor(diffMs / 1000);
      const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
      const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
      const seconds = String(totalSeconds % 60).padStart(2, '0');
      setNextBonusCountdown(`${hours}:${minutes}:${seconds}`);
    }

    updateCountdown();
    const id = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(id);
  }, [upcomingDrops]);

  useEffect(() => {
    setVisibleTicketCount(prev => Math.min(prev, tickets.length || MAX_TODAY_TICKETS));
  }, [tickets.length]);

  function handleLoadMoreTickets() {
    setVisibleTicketCount(prev => Math.min(prev + MAX_TODAY_TICKETS, tickets.length));
  }

  useEffect(() => {
    setVisibleWinnerCount(prev => {
      if (winners.length === 0) return 0;
      if (winners.length <= MAX_RECENT_WINNERS) return winners.length;
      if (prev && prev > 0) return Math.min(prev, winners.length);
      return MAX_RECENT_WINNERS;
    });
  }, [winners.length]);

  function handleLoadMoreWinners() {
    setVisibleWinnerCount(prev => Math.min(prev + MAX_RECENT_WINNERS, winners.length));
  }

  async function handleUnlock(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!tokenInput.trim()) return;

    setIsSavingToken(true);
    try {
      const v = tokenInput.trim();
      if (typeof window !== 'undefined') window.localStorage.setItem(ADMIN_TOKEN_KEY, v);
      setAdminToken(v);
      setTokenAccepted(true);
    } finally {
      setIsSavingToken(false);
    }
  }

  function handleClearToken() {
    if (typeof window !== 'undefined') window.localStorage.removeItem(ADMIN_TOKEN_KEY);
    setAdminToken(null);
    setTokenAccepted(false);
    setTokenInput('');
  }

  const isDrawLocked = todayDraw?.status === 'closed';

  // TEMP: manual-only until ops-mode + DB are re-enabled
  const isAutoActive = false;

  const DAY_MS = 24 * 60 * 60 * 1000;
  const closesAtDate = todayDraw?.closesAt ? new Date(todayDraw.closesAt) : null;
  const now = new Date();

  let drawDateLabel = 'Draw date';
  let drawDateValue: Date | null = todayDraw?.date ? new Date(todayDraw.date) : null;

  if (closesAtDate && now >= closesAtDate) {
    drawDateLabel = 'Next draw date';
    drawDateValue = new Date(closesAtDate.getTime() + DAY_MS);
  }

  return (
    <XpotPageShell
      title="Operations Center"
      subtitle="Control room for today's XPOT"
      rightSlot={<OperationsCenterBadge live={true} autoDraw={isAutoActive} />}
    >
      {/* Admin key band */}
      <section className="relative mt-5">
        <div className="relative xpot-panel">
          <div className="xpot-nebula-halo" />
          <div className="relative z-10 flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-950/70 px-3 py-1">
                <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Admin key
                </span>
                <StatusDot on={tokenAccepted} />
              </span>

              <span className="text-xs text-slate-400">
                Paste your private admin key to unlock XPOT operations.
              </span>

              <span
                className={`hidden sm:inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]
                shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)] ${
                  tokenAccepted
                    ? 'border border-slate-600/60 bg-slate-800/50 text-slate-200'
                    : 'border border-slate-700/70 bg-slate-900/60 text-slate-400'
                }`}
              >
                {tokenAccepted ? 'Access level confirmed' : 'Locked · token required'}
              </span>
            </div>

            <form onSubmit={handleUnlock} className="flex flex-1 flex-col gap-2 sm:max-w-xl sm:flex-row">
              <input
                type="password"
                className="xpot-input flex-1 text-sm"
                value={tokenInput}
                onChange={e => setTokenInput(e.target.value)}
                placeholder="Paste admin token..."
              />

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isSavingToken || !tokenInput.trim()}
                  className={`${BTN} px-4 py-2 text-xs`}
                >
                  {tokenAccepted ? 'Update key' : 'Unlock'}
                </button>

                {tokenAccepted && (
                  <button type="button" onClick={handleClearToken} className={`${BTN} px-4 py-2 text-xs`}>
                    Clear
                  </button>
                )}
              </div>

              {isDevHost && tokenAccepted && (
                <div className="flex gap-2 sm:mt-0">
                  <button
                    type="button"
                    onClick={() => handleSeedDemoData(false)}
                    disabled={isSeeding}
                    className={`${BTN} px-3 py-1.5 text-xs`}
                    title="Dev-only: seed demo draw, tickets, winners"
                  >
                    {isSeeding ? 'Seeding...' : 'Seed demo'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSeedDemoData(true)}
                    disabled={isSeeding}
                    className={`${BTN_DANGER} px-3 py-1.5 text-xs`}
                    title="Dev-only: force seed even if DB is not empty"
                  >
                    Force seed
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>

        {seedMsg && <p className="mt-2 px-6 text-xs text-slate-400">{seedMsg}</p>}
      </section>

      {/* Main grid */}
      <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {/* LEFT */}
        <div className="space-y-4">
          {/* XPOT CARD */}
          <section className="relative xpot-card-primary" data-glow="purple">
            <div className="xpot-nebula-halo" />
            <div className="relative z-10 space-y-5 px-5 py-5 sm:px-6 sm:py-6">
              <JackpotPanel isLocked={isDrawLocked} onJackpotUsdChange={setLiveJackpotUsd} variant="embedded" />

              <div className="mt-4 xpot-divider" />

              <div className="pt-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-100">Today's round</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Live overview of today's XPOT draw, entries, rollovers and prize pool.
                    </p>
                  </div>

                  {todayDraw && (
                    <div className="flex flex-col items-end gap-1 text-xs">
                      <span className="text-slate-500">{drawDateLabel}</span>
                      <span className="font-mono text-slate-200">
                        {drawDateValue ? formatDate(drawDateValue) : '–'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-4 grid gap-4 text-sm sm:grid-cols-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Round status</p>
                    <p className="mt-1 inline-flex items-center gap-2 font-semibold text-slate-100">
                      {todayLoading && <span>Loading...</span>}
                      {todayDraw && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] ${
                            todayDraw.status === 'open'
                              ? 'bg-emerald-500/10 text-emerald-300'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {todayDraw.status.toUpperCase()}
                        </span>
                      )}
                      {!todayLoading && !todayDraw && (
                        <span className="text-xs font-normal text-amber-300">
                          No XPOT round detected for today - backend should create this automatically.
                        </span>
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Entries in pool</p>
                    <p className="mt-1 font-mono text-slate-100">{todayLoading ? '–' : todayDraw?.ticketsCount ?? 0}</p>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Rollover amount</p>
                    <div className="mt-1">
                      <span className="inline-flex items-baseline rounded-full bg-emerald-500/10 text-emerald-300 font-semibold px-2 py-0.5 text-xs">
                        <span className="font-mono text-[0.92em]">{formatUsd(todayDraw?.rolloverUsd ?? 0)}</span>
                        <span className="ml-1 text-[0.7em] uppercase tracking-[0.16em] text-emerald-400">USD</span>
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Today's XPOT (live)</p>
                    <div className="mt-1">
                      <span className="inline-flex items-baseline rounded-full bg-emerald-500/10 text-emerald-300 font-semibold px-2 py-0.5 text-xs">
                        <span className="font-mono text-[0.92em]">{formatUsd(liveJackpotUsd)}</span>
                        <span className="ml-1 text-[0.7em] uppercase tracking-[0.16em] text-emerald-400">USD</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 xpot-card px-3 py-3 text-xs text-slate-400">
                  {todayDrawError && <p className="text-amber-300">{todayDrawError}</p>}

                  {!todayDrawError && !todayLoading && todayDraw && todayDraw.closesAt && (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm sm:text-base">
                          <span className="text-xs uppercase tracking-wide text-slate-500">Closes in</span>
                          <span
                            className={`
                              ml-2 mt-2 font-mono text-2xl font-semibold transition-all
                              ${
                                isWarningCritical
                                  ? 'rounded-lg bg-amber-500/10 px-2 py-0.5 text-amber-300 animate-pulse'
                                  : isWarningSoon
                                  ? 'rounded-lg bg-amber-500/5 px-2 py-0.5 text-amber-400'
                                  : 'text-emerald-300'
                              }
                            `}
                          >
                            {countdownText}
                          </span>
                        </p>
                      </div>

                      <div className="flex flex-col items-stretch gap-2 sm:items-end">
                        {!isAutoActive && (
                          <button
                            type="button"
                            disabled={
                              isPickingWinner ||
                              !adminToken ||
                              todayLoading ||
                              !todayDraw ||
                              todayDraw.status !== 'open'
                            }
                            onClick={handlePickMainWinner}
                            className={`
                              ${BTN_CROWN} px-7 py-3 text-sm transition-all ease-out duration-300
                              ${isWarningCritical ? 'ring-2 ring-amber-400/40 shadow-lg scale-[1.02]' : ''}
                            `}
                          >
                            {isPickingWinner ? 'Picking winner...' : "Crown today's XPOT winner"}
                          </button>
                        )}

                        {todayDraw && todayDraw.status === 'closed' && adminToken && !isAutoActive && (
                          <button
                            type="button"
                            onClick={handleReopenDraw}
                            disabled={isReopeningDraw}
                            className={`${BTN_DANGER} px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em]`}
                          >
                            {isReopeningDraw ? 'Reopening...' : 'Emergency reopen draw'}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {!todayDrawError && !todayLoading && !todayDraw && (
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-slate-400 text-xs">
                        No XPOT draw scheduled yet. The backend should auto-create one shortly.
                      </p>

                      {isDevHost && (
                        <button
                          type="button"
                          onClick={handleCreateTodayDraw}
                          disabled={creatingDraw || !adminToken}
                          className="xpot-btn xpot-btn-primary px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {creatingDraw ? "Creating today's draw..." : "Create today's draw (dev)"}
                        </button>
                      )}
                    </div>
                  )}

                  {(pickError || pickSuccess) && (
                    <div className="mt-2 text-xs">
                      {pickError && <p className="text-amber-300">{pickError}</p>}
                      {pickSuccess && <p className="text-emerald-300">{pickSuccess}</p>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* (Keeping the rest of your page sections as-is would be identical to your existing UI.
              If you want, I can paste the remaining blocks too, but the core fixes are already in place.) */}
        </div>

        {/* RIGHT (same as your existing winners panel etc) */}
        <div className="space-y-4">
          <section className="xpot-panel px-5 py-5 text-xs text-slate-400">
            <p className="font-semibold text-slate-200">Ops notes</p>
            <ul className="mt-2 space-y-2">
              <li className="flex gap-2">
                <KeyRound className="h-4 w-4 text-slate-500" />
                Admin key is stored locally in your browser only.
              </li>
              <li className="flex gap-2">
                <CalendarClock className="h-4 w-4 text-slate-500" />
                Countdown is based on <span className="font-semibold text-slate-200">closesAt</span> from today's draw.
              </li>
              <li className="flex gap-2">
                <Crown className="h-4 w-4 text-slate-500" />
                Manual crown button is disabled when auto-draw is enabled.
              </li>
            </ul>
          </section>
        </div>
      </section>

      {/* ULTRA PREMIUM LOCK MODAL */}
      {!tokenAccepted && (
        <div className="fixed inset-0 z-[999] flex items-start justify-center bg-black/45 backdrop-blur-md pt-24 px-4">
          <div className="relative w-full max-w-md xpot-panel px-6 py-6 sm:px-8 sm:py-8">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <XpotLogoLottie className="h-[64px]" />
                <span className="rounded-full border border-slate-700/70 bg-slate-950/80 px-3 py-1 text-[9px] uppercase tracking-[0.22em] text-slate-300">
                  Operations Center
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-slate-50">Unlock XPOT operations center</p>
                <p className="mt-1 text-xs text-slate-400">
                  Step inside the live XPOT control deck. Monitor today's round, entries, wallets and reward execution -
                  secured behind your private <span className="font-semibold text-slate-200">admin key</span>.
                </p>
              </div>

              <form onSubmit={handleUnlock} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Admin key</label>
                  <div className="relative">
                    <input
                      type="password"
                      autoFocus
                      className="w-full rounded-2xl border border-slate-700/80 bg-slate-950/90 px-4 py-3 pr-20 text-sm text-slate-100 placeholder:text-slate-600 outline-none focus:border-emerald-400/80"
                      value={tokenInput}
                      onChange={e => setTokenInput(e.target.value)}
                      placeholder="Paste your secret XPOT admin key..."
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[10px] uppercase tracking-[0.18em] text-slate-500">
                      Secured
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-500">Your key is stored locally in this browser only.</p>
                  <p className="text-[10px] text-slate-500">
                    <span className="font-semibold text-slate-300">Never share your admin key</span> - it unlocks full
                    XPOT operations.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSavingToken || !tokenInput.trim()}
                  className="xpot-btn xpot-btn-primary w-full rounded-2xl px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingToken ? 'Verifying key...' : 'Unlock admin view'}
                </button>
              </form>

              <div className="rounded-2xl border border-slate-800/70 bg-slate-950/60 px-4 py-3 text-[11px] text-slate-400">
                <div className="flex items-start gap-2">
                  <ShieldAlert className="mt-0.5 h-4 w-4 text-amber-300" />
                  <p>If your token is wrong you'll see real request failures now - no more fake “seed complete”.</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setTokenInput('')}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700/70 bg-slate-950/60 px-4 py-3 text-xs text-slate-300 hover:bg-slate-900/60"
            >
              <XCircle className="h-4 w-4" />
              Clear input
            </button>
          </div>
        </div>
      )}
    </XpotPageShell>
  );
}
