'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import JackpotPanel from '@/components/JackpotPanel';
import Modal from '@/components/Modal';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type DrawStatus = 'open' | 'closed' | 'completed';

type TodayDraw = {
  id: string;
  date: string;
  status: DrawStatus;
  jackpotUsd: number;
  rolloverUsd: number;
  ticketsCount: number;
  closesAt?: string;
};

type TicketStatus = 'in-draw' | 'expired' | 'not-picked' | 'won' | 'claimed';

type AdminTicket = {
  id: string;
  code: string;
  walletAddress: string;
  status: TicketStatus;
  createdAt: string;
  jackpotUsd?: number;
};

type AdminWinner = {
  drawId: string;
  date: string;
  ticketCode: string;
  walletAddress: string;
  jackpotUsd: number;
  paidOut: boolean;
  txUrl?: string;
};

const ADMIN_TOKEN_KEY = 'xpot_admin_token';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function formatUsd(amount: number | undefined | null) {
  if (typeof amount !== 'number' || Number.isNaN(amount)) return '$0';
  return `$${amount.toLocaleString('en-US', {
    maximumFractionDigits: 0,
  })}`;
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function AdminPage() {
  const [adminToken, setAdminToken] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [checkingToken, setCheckingToken] = useState(false);

  const [todayDraw, setTodayDraw] = useState<TodayDraw | null>(null);
  const [todayError, setTodayError] = useState<string | null>(null);
  const [loadingToday, setLoadingToday] = useState(false);

  const [todayTickets, setTodayTickets] = useState<AdminTicket[]>([]);
  const [ticketsError, setTicketsError] = useState<string | null>(null);
  const [loadingTickets, setLoadingTickets] = useState(false);

  const [recentWinners, setRecentWinners] = useState<AdminWinner[]>([]);
  const [winnersError, setWinnersError] = useState<string | null>(null);
  const [loadingWinners, setLoadingWinners] = useState(false);

  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [liveJackpotUsd, setLiveJackpotUsd] = useState<number | null>(null);

  // Winner state
  const [pickingWinner, setPickingWinner] = useState(false);
  const [lastPickedWinner, setLastPickedWinner] = useState<{
    ticketCode: string;
    walletAddress: string;
    jackpotUsd?: number;
  } | null>(null);
  const [winnerJustPicked, setWinnerJustPicked] = useState(false);

  // Live countdown to draw close (admin view)
  useEffect(() => {
    function updateCountdown() {
      const closesAt = todayDraw?.closesAt;
      const status = todayDraw?.status;

      if (!closesAt || status !== 'open') {
        setTimeLeft(null);
        return;
      }

      const target = new Date(closesAt).getTime();
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft('00:00:00');
        return;
      }

      const totalSeconds = Math.floor(diff / 1000);
      const hours = Math.floor(totalSeconds / 3600)
        .toString()
        .padStart(2, '0');
      const minutes = Math.floor((totalSeconds % 3600) / 60)
        .toString()
        .padStart(2, '0');
      const seconds = (totalSeconds % 60).toString().padStart(2, '0');

      setTimeLeft(`${hours}:${minutes}:${seconds}`);
    }

    updateCountdown();
    const id = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(id);
  }, [todayDraw?.closesAt, todayDraw?.status]);

  // Modal state for pick-winner
  const [showPickModal, setShowPickModal] = useState(false);
  const [pickError, setPickError] = useState<string | null>(null);

  // Modal state for reopen-draw
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenError, setReopenError] = useState<string | null>(null);
  const [reopening, setReopening] = useState(false);

  // Load stored token on first render (browser only)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(ADMIN_TOKEN_KEY);
    if (stored) {
      setAdminToken(stored);
      setTokenInput(stored);
      setTokenValid(true);
    }
  }, []);

  // Small helper for admin fetches with header
  async function adminFetch(path: string, options: RequestInit = {}) {
    if (!adminToken) {
      throw new Error('NO_ADMIN_TOKEN');
    }

    const res = await fetch(path, {
      ...options,
      headers: {
        ...(options.headers || {}),
        'x-admin-token': adminToken,
      },
      cache: 'no-store',
    });

    if (res.status === 401) {
      setTokenValid(false);
      throw new Error('UNAUTHORIZED');
    }

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Request failed: ${res.status}`);
    }

    return res.json();
  }

  // Re-open draw (called from modal)
  async function handleReopenDraw() {
    if (!todayDraw) return;

    try {
      setReopening(true);
      setReopenError(null);

      const data = await adminFetch('/api/admin/draw/reopen', {
        method: 'POST',
      });

      if (!data.ok) {
        throw new Error(data.error ?? 'Unknown error');
      }

      setShowReopenModal(false);
      await loadAll();
    } catch (err) {
      console.error('[ADMIN] reopen-draw error:', err);
      setReopenError(
        err instanceof Error ? err.message : 'Failed to re-open draw',
      );
    } finally {
      setReopening(false);
    }
  }

  // Verify token against /api/admin/health
  async function verifyToken() {
    if (!tokenInput) {
      setTokenValid(false);
      return;
    }

    setCheckingToken(true);
    setTokenValid(null);

    try {
      const res = await fetch('/api/admin/health', {
        headers: { 'x-admin-token': tokenInput },
        cache: 'no-store',
      });

      if (!res.ok) {
        setTokenValid(false);
        return;
      }

      const data = await res.json();
      if (data.ok) {
        setAdminToken(tokenInput);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(ADMIN_TOKEN_KEY, tokenInput);
        }
        setTokenValid(true);
        await loadAll(tokenInput);
      } else {
        setTokenValid(false);
      }
    } catch (err) {
      console.error('[ADMIN] Health check failed:', err);
      setTokenValid(false);
    } finally {
      setCheckingToken(false);
    }
  }

  // Load all admin data (today + tickets + winners)
  async function loadAll(optionalToken?: string) {
    const token = optionalToken ?? adminToken;
    if (!token) return;

    setTodayError(null);
    setTicketsError(null);
    setWinnersError(null);

    setLoadingToday(true);
    setLoadingTickets(true);
    setLoadingWinners(true);

    try {
      const headers = { 'x-admin-token': token };

      const [drawRes, ticketsRes, winnersRes] = await Promise.all([
        fetch('/api/admin/draw/today', { headers, cache: 'no-store' }),
        fetch('/api/admin/draw/today/tickets', {
          headers,
          cache: 'no-store',
        }),
        fetch('/api/admin/draw/recent-winners', {
          headers,
          cache: 'no-store',
        }),
      ]);

      if (
        drawRes.status === 401 ||
        ticketsRes.status === 401 ||
        winnersRes.status === 401
      ) {
        setTokenValid(false);
        throw new Error('UNAUTHORIZED');
      }

      const drawJson = drawRes.ok ? await drawRes.json() : null;
      const ticketsJson = ticketsRes.ok ? await ticketsRes.json() : null;
      const winnersJson = winnersRes.ok ? await winnersRes.json() : null;

      if (drawJson?.ok) {
        setTodayDraw(drawJson.draw);
      } else if (!drawRes.ok) {
        setTodayError(`Failed to load today’s draw (${drawRes.status})`);
      }

      if (ticketsJson?.ok && Array.isArray(ticketsJson.tickets)) {
        setTodayTickets(ticketsJson.tickets);
      } else if (!ticketsRes.ok) {
        setTicketsError(
          `Failed to load today’s tickets (${ticketsRes.status})`,
        );
      }

      if (winnersJson?.ok && Array.isArray(winnersJson.winners)) {
        setRecentWinners(winnersJson.winners);
      } else if (!winnersRes.ok) {
        setWinnersError(
          `Failed to load recent winners (${winnersRes.status})`,
        );
      }
    } catch (err) {
      console.error('[ADMIN] loadAll error:', err);
      const msg =
        err instanceof Error ? err.message : 'Unexpected admin error';
      if (!todayError) setTodayError(msg);
      if (!ticketsError) setTicketsError(msg);
      if (!winnersError) setWinnersError(msg);
    } finally {
      setLoadingToday(false);
      setLoadingTickets(false);
      setLoadingWinners(false);
    }
  }

  // Whenever a valid token is set, auto-load data
  useEffect(() => {
    if (adminToken) {
      void loadAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminToken]);

  // Live jackpot from Jupiter = 1,000,000 XPOT
  useEffect(() => {
    async function loadLiveJackpot() {
      try {
        const res = await fetch('/api/xpot/price', { cache: 'no-store' });
        if (!res.ok) return;

        const data = await res.json();
        const pricePerXpot = data.priceUsd;

        if (typeof pricePerXpot === 'number' && !Number.isNaN(pricePerXpot)) {
          const jackpot = pricePerXpot * 1_000_000;
          setLiveJackpotUsd(jackpot);
        }
     
