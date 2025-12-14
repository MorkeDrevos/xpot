// app/api/admin/dev-seed/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/app/api/admin/_auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ─────────────────────────────────────────────
// Dev-only gate
// ─────────────────────────────────────────────
function isDevRequest(req: Request) {
  const host = (req.headers.get('host') || '').toLowerCase();
  const vercelEnv = (process.env.VERCEL_ENV || '').toLowerCase(); // production | preview | development

  // Hard block production
  if (vercelEnv === 'production') return false;

  // Allow dev subdomain, localhost, or preview
  if (host.startsWith('dev.') || host.includes('localhost') || vercelEnv === 'preview')
    return true;

  // Non-prod but unknown host: still allow (you can tighten later)
  return true;
}

// ─────────────────────────────────────────────
// Random helpers
// ─────────────────────────────────────────────
function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomBase58(len: number) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[randInt(0, chars.length - 1)];
  return s;
}

function fakeWalletAddress() {
  // Solana-ish base58 length
  return randomBase58(44);
}

function fakeTxUrl() {
  const sig = randomBase58(88);
  return `https://solscan.io/tx/${sig}`;
}

function isoDayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function startOfUtcDay(d = new Date()) {
  const yyyyMmDd = isoDayKey(d);
  return new Date(`${yyyyMmDd}T00:00:00.000Z`);
}

// Stable-ish fake X avatars (any URL works)
function fakeAvatarUrl(handle: string) {
  // Placeholder avatar service
  return `https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(handle)}`;
}

function pick<T>(arr: T[]) {
  return arr[randInt(0, arr.length - 1)];
}

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─────────────────────────────────────────────
// “More realism” knobs
// ─────────────────────────────────────────────
// 3 draws: day-2 completed, day-1 completed, today open
const DRAWS_TO_CREATE = 3;

// Total wallet pool (some repeat entrants)
const WALLET_POOL_SIZE = 140;

// Users (X identity) to attach to some wallets
const USER_COUNT = 45;

// Tickets per draw (bigger + realistic)
const TICKETS_PER_DRAW = [60, 70, 90]; // day-2, day-1, today

// Winners per completed draw
const MAIN_WINNERS_PER_COMPLETED_DRAW = 1;
const BONUS_WINNERS_PER_COMPLETED_DRAW = 3;

// Bonus drops for today
const BONUS_DROPS_TODAY = 8;

// Ticket status mix for “today” (open draw)
const TODAY_STATUS_DIST: Array<{ status: 'IN_DRAW' | 'EXPIRED' | 'NOT_PICKED'; weight: number }> =
  [
    { status: 'IN_DRAW', weight: 78 },
    { status: 'EXPIRED', weight: 7 },
    { status: 'NOT_PICKED', weight: 15 },
  ];

// ─────────────────────────────────────────────
export async function POST(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  if (!isDevRequest(req)) {
    return NextResponse.json(
      { ok: false, error: 'DEV_ONLY', message: 'Dev seed is disabled in production.' },
      { status: 403 },
    );
  }

  const url = new URL(req.url);
  const force = url.searchParams.get('force') === '1';

  try {
    // Detect “empty-ish”
    const [drawCount, ticketCount, walletCount, userCount, winnerCount, bonusCount] =
      await Promise.all([
        prisma.draw.count(),
        prisma.ticket.count(),
        prisma.wallet.count(),
        prisma.user.count(),
        prisma.winner.count(),
        prisma.bonusDrop.count(),
      ]);

    const isEmpty =
      drawCount === 0 &&
      ticketCount === 0 &&
      walletCount === 0 &&
      userCount === 0 &&
      winnerCount === 0 &&
      bonusCount === 0;

    if (!force && !isEmpty) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        message: 'DB is not empty - skipping seed (use ?force=1 to override).',
        counts: { drawCount, ticketCount, walletCount, userCount, winnerCount, bonusCount },
      });
    }

    // Build draw dates: day-2, day-1, today
    const today = startOfUtcDay(new Date());
    const day1 = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const day2 = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);
    const drawDays = [day2, day1, today].slice(-DRAWS_TO_CREATE);

    // Ensure draws exist (by unique drawDate)
    const draws = [];
    for (let i = 0; i < drawDays.length; i++) {
      const drawDate = drawDays[i];

      const existing = await prisma.draw.findUnique({
        where: { drawDate },
      });

      if (existing) {
        draws.push(existing);
        continue;
      }

      const isToday = isoDayKey(drawDate) === isoDayKey(today);

      const closesAt = isToday
        ? new Date(Date.now() + 60 * 60 * 1000) // +1h for today
        : new Date(drawDate.getTime() + 22 * 60 * 60 * 1000); // historical closesAt

      const status = isToday ? 'open' : 'completed';

      const created = await prisma.draw.create({
        data: {
          drawDate,
          closesAt,
          status,
        },
      });

      draws.push(created);
    }

    // Create a pool of users with X identities (unique handles)
    const handleBases = [
      'XPOTMaxi',
      'CandleChaser',
      'LatencyLord',
      'AlphaSmith',
      'SolanaSignals',
      'ChartHermit',
      'BlockByBlock',
      'HypeEngineer',
      'LoopMode',
      'FlowState',
      'NebulaPilot',
      'RaydiumRanger',
      'JupiterJockey',
      'MintWizard',
      'WalletWhisper',
    ];

    const users = [];
    for (let i = 0; i < USER_COUNT; i++) {
      const handle = `${pick(handleBases)}_${randInt(1000, 9999)}_${randomBase58(3)}`;

      // xHandle is unique - skip if collision
      const existing = await prisma.user.findFirst({ where: { xHandle: handle } });
      if (existing) {
        users.push(existing);
        continue;
      }

      const u = await prisma.user.create({
        data: {
          xHandle: handle,
          xName: handle.replace(/_/g, ' '),
          xAvatarUrl: fakeAvatarUrl(handle),
        },
      });

      users.push(u);
    }

    // Create wallet pool (some linked to users, some anonymous)
    const wallets = [];
    for (let i = 0; i < WALLET_POOL_SIZE; i++) {
      const address = fakeWalletAddress();

      // address is unique - skip collisions
      const existing = await prisma.wallet.findFirst({ where: { address } });
      if (existing) {
        wallets.push(existing);
        continue;
      }

      const linkToUser = i < Math.floor(WALLET_POOL_SIZE * 0.55); // ~55% wallets have a user
      const user = linkToUser ? pick(users) : null;

      const w = await prisma.wallet.create({
        data: {
          address,
          userId: user?.id ?? null,
        },
      });

      wallets.push(w);
    }

    // Helper to choose status by distribution
    function weightedTodayStatus() {
      const total = TODAY_STATUS_DIST.reduce((a, b) => a + b.weight, 0);
      let r = randInt(1, total);
      for (const item of TODAY_STATUS_DIST) {
        r -= item.weight;
        if (r <= 0) return item.status;
      }
      return 'IN_DRAW';
    }

    // Create tickets across draws (reusing wallet pool to simulate repeat entrants)
    const createdTickets: Array<{
      id: string;
      drawId: string;
      status: 'IN_DRAW' | 'EXPIRED' | 'NOT_PICKED' | 'WON' | 'CLAIMED';
      walletAddress: string;
      code: string;
    }> = [];

    for (let i = 0; i < draws.length; i++) {
      const draw = draws[i];
      const isToday = isoDayKey(draw.drawDate) === isoDayKey(today);

      const count =
        TICKETS_PER_DRAW[i] ?? TICKETS_PER_DRAW[TICKETS_PER_DRAW.length - 1] ?? 60;

      const localWallets = shuffle(wallets);

      for (let n = 0; n < count; n++) {
        const wallet = localWallets[n % localWallets.length];

        // Ensure unique ticket code
        const code = `XPOT-${isoDayKey(draw.drawDate)}-${randInt(100000, 999999)}-${randomBase58(
          2,
        )}-${n + 1}`;

        const status = isToday ? weightedTodayStatus() : 'NOT_PICKED';

        const t = await prisma.ticket.create({
          data: {
            drawId: draw.id,
            code,
            walletId: wallet.id,
            walletAddress: wallet.address,
            status,
          },
        });

        createdTickets.push({
          id: t.id,
          drawId: t.drawId,
          status: t.status as any,
          walletAddress: t.walletAddress,
          code: t.code,
        });
      }
    }

    // For completed draws: create winners (MAIN + BONUS), and set ticket statuses WON/CLAIMED
    const createdWinners: string[] = [];

    const completedDraws = draws.filter(d => isoDayKey(d.drawDate) !== isoDayKey(today));

    for (const draw of completedDraws) {
      const ticketsForDraw = createdTickets.filter(t => t.drawId === draw.id);

      // Pick distinct winners
      const candidates = shuffle(ticketsForDraw);

      const mainTickets = candidates.slice(0, MAIN_WINNERS_PER_COMPLETED_DRAW);
      const bonusTickets = candidates.slice(
        MAIN_WINNERS_PER_COMPLETED_DRAW,
        MAIN_WINNERS_PER_COMPLETED_DRAW + BONUS_WINNERS_PER_COMPLETED_DRAW,
      );

      // MAIN winner(s)
      for (const t of mainTickets) {
        const paid = Math.random() < 0.8; // mostly paid in history

        const w = await prisma.winner.create({
          data: {
            drawId: draw.id,
            ticketId: t.id,
            date: new Date(draw.drawDate.getTime() + 23 * 60 * 60 * 1000), // late in the day
            ticketCode: t.code,
            walletAddress: t.walletAddress,
            jackpotUsd: 229.64 + Math.random() * 20,
            payoutUsd: 1_000_000,
            isPaidOut: paid,
            txUrl: paid ? fakeTxUrl() : null,
            kind: 'MAIN',
            label: 'Main XPOT',
          },
        });

        createdWinners.push(w.id);

        // Ticket status: WON or CLAIMED (if paid)
        await prisma.ticket.update({
          where: { id: t.id },
          data: { status: paid ? 'CLAIMED' : 'WON' },
        });
      }

      // BONUS winners
      for (let i = 0; i < bonusTickets.length; i++) {
        const t = bonusTickets[i];
        const paid = Math.random() < 0.55; // more unpaid in bonus history

        const w = await prisma.winner.create({
          data: {
            drawId: draw.id,
            ticketId: t.id,
            date: new Date(draw.drawDate.getTime() + (18 + i) * 60 * 60 * 1000),
            ticketCode: t.code,
            walletAddress: t.walletAddress,
            jackpotUsd: 0,
            payoutUsd: 25_000 + randInt(0, 75_000),
            isPaidOut: paid,
            txUrl: paid ? fakeTxUrl() : null,
            kind: 'BONUS',
            label: `Bonus XPOT #${i + 1}`,
          },
        });

        createdWinners.push(w.id);

        await prisma.ticket.update({
          where: { id: t.id },
          data: { status: paid ? 'CLAIMED' : 'WON' },
        });
      }
    }

    // Today: create some bonus drops (mixed statuses)
    const todayDraw = draws.find(d => isoDayKey(d.drawDate) === isoDayKey(today));
    if (todayDraw) {
      for (let i = 0; i < BONUS_DROPS_TODAY; i++) {
        const minutes = (i + 1) * 7;

        const roll = Math.random();
        const status = roll < 0.7 ? 'SCHEDULED' : roll < 0.85 ? 'FIRED' : 'CANCELLED';

        await prisma.bonusDrop.create({
          data: {
            drawId: todayDraw.id,
            label: `Bonus XPOT #${i + 1}`,
            amountXpot: 10_000 * (i + 1) + randInt(0, 7_500),
            scheduledAt: new Date(Date.now() + minutes * 60 * 1000),
            status,
          },
        });
      }
    }

    // Done: return a compact summary
    const summary = {
      ok: true,
      seeded: true,
      force,
      created: {
        draws: draws.length,
        users: users.length,
        wallets: wallets.length,
        tickets: createdTickets.length,
        winners: createdWinners.length,
        bonusDrops: todayDraw ? BONUS_DROPS_TODAY : 0,
      },
      notes: [
        `Draws: ${draws.map(d => isoDayKey(d.drawDate)).join(', ')}`,
        `Tickets per draw: ${TICKETS_PER_DRAW.join(', ')}`,
        `Winners created only for completed draws (MAIN + BONUS).`,
        `Today draw is open with mixed ticket statuses and bonus drops.`,
      ],
    };

    return NextResponse.json(summary);
  } catch (err: any) {
    console.error('[dev-seed] failed', err);

    return NextResponse.json(
      {
        ok: false,
        error: 'SEED_FAILED',
        message: err?.message || 'Unknown seed failure',
        detail:
          typeof err === 'object' ? (err?.stack ? String(err.stack) : JSON.stringify(err)) : String(err),
      },
      { status: 500 },
    );
  }
}
