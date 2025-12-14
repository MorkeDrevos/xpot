// app/api/admin/dev-seed/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/app/api/admin/_auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function isDevRequest(req: Request) {
  const host = (req.headers.get('host') || '').toLowerCase();
  const vercelEnv = (process.env.VERCEL_ENV || '').toLowerCase(); // 'production' | 'preview' | 'development'
  // Hard block production
  if (vercelEnv === 'production') return false;
  // Allow dev subdomain, localhost, or preview
  if (host.startsWith('dev.') || host.includes('localhost') || vercelEnv === 'preview') return true;
  return true; // permissive for non-prod
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]) {
  return arr[randInt(0, arr.length - 1)];
}

function randomBase58(len: number) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[randInt(0, chars.length - 1)];
  return s;
}

function fakeWalletAddress() {
  return randomBase58(44);
}

function fakeTxUrl() {
  const sig = randomBase58(88);
  return `https://solscan.io/tx/${sig}`;
}

function isoDayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function startOfUtcDay(d: Date) {
  const yyyyMmDd = isoDayKey(d);
  return new Date(`${yyyyMmDd}T00:00:00.000Z`);
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + days);
  return x;
}

function avatarFromHandle(handle: string) {
  // simple deterministic placeholder avatar (not calling external services)
  const n = handle.length * 17;
  return `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(handle)}&radius=50&backgroundType=gradientLinear&size=96&b=${n}`;
}

const HANDLE_POOL = [
  'XPOTMaxi',
  'CandleChaser',
  'LatencyLord',
  'AlphaSmith',
  'ChartHermit',
  'LoopMode',
  'SolanaSignals',
  'BlockByBlock',
  'FlowStateTrader',
  'HypeEngineer',
  'DeWala_222222',
  'CryptoNox',
  'NebulaNomad',
  'DiamondHandsHQ',
  'WalletWhisperer',
  'MemeMechanic',
  'OrderbookOwl',
  'ArcadeApe',
  'MintMuse',
  'YieldYeti',
  'GaslessGandalf',
  'SatoshiSailor',
  'DriftDegen',
  'RaydiumRunner',
  'JupiterJockey',
  'TxTrailblazer',
  'PhantomPilot',
  'SwapSensei',
  'PnlPirate',
  'StakingStoic',
  'RugRadar',
  'LiquidityLlama',
  'MoonMath',
  'BullishBard',
  'BearishBouncer',
];

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

  // If DB is not empty, "Seed demo" should skip. "Force seed" will rebuild demo days.
  const [drawCount, ticketCount, walletCount, userCount, winnerCount, bonusCount] = await Promise.all([
    prisma.draw.count(),
    prisma.ticket.count(),
    prisma.wallet.count(),
    prisma.user.count(),
    prisma.winner.count(),
    prisma.bonusDrop.count(),
  ]);

  const looksEmpty =
    drawCount === 0 &&
    ticketCount === 0 &&
    walletCount === 0 &&
    userCount === 0 &&
    winnerCount === 0 &&
    bonusCount === 0;

  if (!force && !looksEmpty) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      message: 'DB is not empty - skipping seed (use ?force=1 to override).',
      counts: { drawCount, ticketCount, walletCount, userCount, winnerCount, bonusCount },
    });
  }

  // Demo plan
  const now = new Date();
  const dayMinus2 = startOfUtcDay(addDays(now, -2));
  const dayMinus1 = startOfUtcDay(addDays(now, -1));
  const dayToday = startOfUtcDay(now);

  const demoDays = [dayMinus2, dayMinus1, dayToday];

  // Force mode: wipe ONLY our 3 demo days (safe-ish for dev)
  if (force) {
    const drawsToWipe = await prisma.draw.findMany({
      where: { drawDate: { in: demoDays } },
      select: { id: true },
    });
    const drawIds = drawsToWipe.map((d) => d.id);

    if (drawIds.length) {
      // order matters due to relations
      await prisma.winner.deleteMany({ where: { drawId: { in: drawIds } } });
      await prisma.bonusDrop.deleteMany({ where: { drawId: { in: drawIds } } });
      await prisma.ticket.deleteMany({ where: { drawId: { in: drawIds } } });
      await prisma.draw.deleteMany({ where: { id: { in: drawIds } } });
    }
    // Note: we do NOT delete wallets/users globally (keeps some continuity)
  }

  // Ensure users + wallets exist (reused across days)
  const USERS_TARGET = 35;
  const WALLETS_TARGET = 60;

  // Create users
  const existingUsers = await prisma.user.findMany({ take: USERS_TARGET });
  const users: { id: string; xHandle?: string | null }[] = [...existingUsers];

  while (users.length < USERS_TARGET) {
    const handleBase = pick(HANDLE_POOL);
    const handle = `${handleBase}${randInt(1, 999)}`;
    const created = await prisma.user.create({
      data: {
        xHandle: handle,
        xName: handleBase,
        xAvatarUrl: avatarFromHandle(handle),
      },
      select: { id: true, xHandle: true },
    });
    users.push(created);
  }

  // Create wallets (some linked to users)
  const existingWallets = await prisma.wallet.findMany({ take: WALLETS_TARGET });
  const wallets: { id: string; address: string; userId: string | null }[] = [...existingWallets];

  while (wallets.length < WALLETS_TARGET) {
    const address = fakeWalletAddress();
    const shouldLinkUser = Math.random() < 0.6; // 60% linked to a user
    const user = shouldLinkUser ? pick(users) : null;

    const created = await prisma.wallet.create({
      data: {
        address,
        userId: user?.id ?? null,
      },
      select: { id: true, address: true, userId: true },
    });
    wallets.push(created);
  }

  // Create draws
  const draws = await Promise.all(
    demoDays.map(async (drawDate) => {
      const isToday = isoDayKey(drawDate) === isoDayKey(dayToday);
      const closesAt = new Date(drawDate.getTime() + (isToday ? 60 * 60 * 1000 : 30 * 60 * 1000)); // today closes +1h, past +30m
      const status = isToday ? 'open' : 'completed';

      return prisma.draw.create({
        data: {
          drawDate,
          closesAt,
          status,
        },
      });
    }),
  );

  // Ticket distribution (realistic-ish)
  const ticketsPlan = [
    { draw: draws[0], count: 40, kind: 'past' as const },
    { draw: draws[1], count: 55, kind: 'past' as const },
    { draw: draws[2], count: 60, kind: 'today' as const },
  ];

  const createdTickets: { id: string; drawId: string; walletId: string; code: string; walletAddress: string }[] = [];

  for (const plan of ticketsPlan) {
    for (let i = 0; i < plan.count; i++) {
      const w = pick(wallets);

      const code = `XPOT-${isoDayKey(plan.draw.drawDate)}-${randInt(100000, 999999)}-${randomBase58(2)}`;

      // Past draws have mixed statuses, today is mostly IN_DRAW
      const status =
        plan.kind === 'today'
          ? 'IN_DRAW'
          : pick(['NOT_PICKED', 'NOT_PICKED', 'NOT_PICKED', 'EXPIRED', 'WON']); // sparse winners in past pools

      const t = await prisma.ticket.create({
        data: {
          drawId: plan.draw.id,
          code,
          walletId: w.id,
          walletAddress: w.address,
          status: status as any, // enum TicketStatus
        },
        select: { id: true, drawId: true, walletId: true, code: true, walletAddress: true },
      });

      createdTickets.push(t);
    }
  }

  // Winners: for completed draws only (2 days)
  const createdWinners: string[] = [];

  for (const d of draws.slice(0, 2)) {
    const dayTickets = createdTickets.filter((t) => t.drawId === d.id);
    if (!dayTickets.length) continue;

    // MAIN winner
    const mainTicket = pick(dayTickets);
    const mainAmountUsd = randInt(160, 380) + Math.random();

    await prisma.ticket.update({
      where: { id: mainTicket.id },
      data: { status: 'WON' },
    });

    const mainWinner = await prisma.winner.create({
      data: {
        drawId: d.id,
        ticketId: mainTicket.id,
        date: d.drawDate,
        ticketCode: mainTicket.code,
        walletAddress: mainTicket.walletAddress,
        jackpotUsd: mainAmountUsd,
        payoutUsd: mainAmountUsd,
        isPaidOut: true,
        txUrl: fakeTxUrl(),
        kind: 'MAIN',
        label: 'Main XPOT',
      },
      select: { id: true },
    });

    createdWinners.push(mainWinner.id);

    // BONUS winners (3 each completed day)
    for (let i = 1; i <= 3; i++) {
      const bonusTicket = pick(dayTickets);
      const xpotAmt = randInt(25000, 90000);

      await prisma.ticket.update({
        where: { id: bonusTicket.id },
        data: { status: 'CLAIMED' }, // looks “processed”
      });

      const w = await prisma.winner.create({
        data: {
          drawId: d.id,
          ticketId: bonusTicket.id,
          date: d.drawDate,
          ticketCode: bonusTicket.code,
          walletAddress: bonusTicket.walletAddress,
          jackpotUsd: 0,
          payoutUsd: xpotAmt, // your UI treats this as amount sometimes; ok for demo
          isPaidOut: true,
          txUrl: fakeTxUrl(),
          kind: 'BONUS',
          label: `Bonus XPOT #${i}`,
        },
        select: { id: true },
      });

      createdWinners.push(w.id);
    }
  }

  // Bonus drops: past FIRED + today SCHEDULED
  const createdBonusDrops: string[] = [];

  // Day -1: fired bonus drops
  for (let i = 1; i <= 2; i++) {
    const bd = await prisma.bonusDrop.create({
      data: {
        drawId: draws[1].id,
        label: `Bonus XPOT #${i}`,
        amountXpot: randInt(25000, 90000),
        scheduledAt: new Date(draws[1].drawDate.getTime() + i * 10 * 60 * 1000),
        status: 'FIRED',
      },
      select: { id: true },
    });
    createdBonusDrops.push(bd.id);
  }

  // Today: scheduled
  const bdToday = await prisma.bonusDrop.create({
    data: {
      drawId: draws[2].id,
      label: 'Bonus XPOT',
      amountXpot: 100000,
      scheduledAt: new Date(Date.now() + 15 * 60 * 1000),
      status: 'SCHEDULED',
    },
    select: { id: true },
  });
  createdBonusDrops.push(bdToday.id);

  // Summary (for UI)
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
      bonusDrops: createdBonusDrops.length,
    },
    notes: [
      `Draw dates: ${draws.map((d) => isoDayKey(d.drawDate)).join(', ')}`,
      `Tickets per draw: ${ticketsPlan.map((p) => p.count).join(' + ')} = ${createdTickets.length}`,
      `Winners created only for completed draws (2 days): 2 MAIN + 6 BONUS`,
      `Today draw is open with IN_DRAW tickets + 1 scheduled BonusDrop`,
    ],
  };

  return NextResponse.json(summary);
}
