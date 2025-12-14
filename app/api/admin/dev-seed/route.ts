// app/api/admin/dev-seed/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/app/api/admin/_auth';
import type { Draw, User, Wallet } from '@prisma/client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Absolute safety: never seed if this deployment is production.
function assertNotProduction() {
  const vercelEnv = (process.env.VERCEL_ENV || '').toLowerCase(); // production | preview | development
  if (vercelEnv === 'production') {
    return NextResponse.json(
      {
        ok: false,
        error: 'DEV_SEED_BLOCKED',
        message:
          'Dev seeding is blocked on production deployments. Use a preview/dev deployment with a dev DATABASE_URL.',
        env: { VERCEL_ENV: process.env.VERCEL_ENV ?? null },
      },
      { status: 403 },
    );
  }
  return null;
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomBase58(len: number) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[randInt(0, chars.length - 1)];
  return s;
}

function fakeWallet() {
  return randomBase58(44);
}

function fakeTxUrl() {
  const sig = randomBase58(88);
  return `https://solscan.io/tx/${sig}`;
}

function startOfUtcDay(d = new Date()) {
  const yyyyMmDd = d.toISOString().slice(0, 10);
  return new Date(`${yyyyMmDd}T00:00:00.000Z`);
}
function endOfUtcDay(d = new Date()) {
  const yyyyMmDd = d.toISOString().slice(0, 10);
  return new Date(`${yyyyMmDd}T23:59:59.999Z`);
}

export async function POST(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const prodBlock = assertNotProduction();
  if (prodBlock) return prodBlock;

  const url = new URL(req.url);
  const force = url.searchParams.get('force') === '1';

  try {
    // Counts
    const [drawCount, ticketCount, winnerCount, bonusCount, walletCount, userCount] =
      await Promise.all([
        prisma.draw.count(),
        prisma.ticket.count(),
        prisma.winner.count(),
        prisma.bonusDrop.count(),
        prisma.wallet.count(),
        prisma.user.count(),
      ]);

    const isEmpty =
      drawCount === 0 &&
      ticketCount === 0 &&
      winnerCount === 0 &&
      bonusCount === 0 &&
      walletCount === 0 &&
      userCount === 0;

    if (!force && !isEmpty) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        message: 'DB is not empty - skipping seed (use ?force=1 to override).',
        counts: {
          drawCount,
          ticketCount,
          winnerCount,
          bonusCount,
          walletCount,
          userCount,
        },
      });
    }

    // More realism + ~5x data
    const DRAWS = 3; // two days ago, yesterday, today
    const TICKETS_PER_DRAW = [80, 110, 150]; // ~340 tickets total
    const BONUS_DROPS_PER_DRAW = [2, 3, 4]; // ~9 bonus drops total
    const COMPLETED_DRAWS = 2; // two days ago + yesterday will have winners
    const BONUS_WINNERS_PER_COMPLETED_DRAW = 3;

    const now = new Date();
    const day0 = startOfUtcDay(new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000));
    const day1 = startOfUtcDay(new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000));
    const day2 = startOfUtcDay(now);

    const days = [day0, day1, day2];

    // Create (or upsert) draws per day
    const draws: Draw[] = [];
    for (let i = 0; i < DRAWS; i++) {
      const drawDate = days[i];
      const existing = await prisma.draw.findUnique({ where: { drawDate } });
      if (existing) {
        draws.push(existing);
        continue;
      }

      const closesAt =
        i === 2
          ? new Date(Date.now() + 60 * 60 * 1000)
          : new Date(drawDate.getTime() + 20 * 60 * 60 * 1000);

      const status = i < COMPLETED_DRAWS ? 'completed' : 'open';

      const created = await prisma.draw.create({
        data: {
          drawDate,
          closesAt,
          status,
        },
      });
      draws.push(created);
    }

    // Create a pool of users/wallets so tickets repeat across days (realistic)
    // ~120 wallets, ~45 users. Many wallets not attached to a user (also realistic).
    const USERS = 45;
    const WALLETS = 120;

    const handles = [
      'CandleChaser',
      'AlphaSmith',
      'LatencyLord',
      'ChartHermit',
      'XPOTMaxi',
      'SolanaSignals',
      'BlockByBlock',
      'FlowStateTrader',
      'HypeEngineer',
      'DeWala_222222',
      'CryptoNox',
      'LoopMode',
      'FomoPilot',
      'DipSniper',
      'OrderBookKing',
      'ArbMantis',
      'NebulaNomad',
      'GasGuzzler',
      'WhaleWatcher',
      'MintRanger',
      'KeypairKai',
    ];

    const createdUsers: User[] = [];
    for (let i = 0; i < USERS; i++) {
      const xHandle = `${handles[i % handles.length]}_${randInt(10, 999)}`;
      const user = await prisma.user.create({
        data: {
          xUserId: `x_${randomBase58(10)}`,
          xHandle,
          xName: xHandle.replace(/_/g, ' '),
          xAvatarUrl: `https://api.dicebear.com/8.x/shapes/svg?seed=${encodeURIComponent(
            xHandle,
          )}`,
        },
      });
      createdUsers.push(user);
    }

    const createdWallets: Wallet[] = [];
    for (let i = 0; i < WALLETS; i++) {
      const address = fakeWallet();
      const maybeUser = i < USERS ? createdUsers[i] : null;

      const w = await prisma.wallet.create({
        data: {
          address,
          userId: maybeUser?.id ?? null,
        },
      });
      createdWallets.push(w);
    }

    // Tickets per draw (mix of statuses)
    const createdTickets: { id: string; drawId: string }[] = [];

    for (let i = 0; i < draws.length; i++) {
      const draw = draws[i];
      const ticketCountForDay = TICKETS_PER_DRAW[i];

      const rows = Array.from({ length: ticketCountForDay }).map((_, t) => {
        const wallet = createdWallets[randInt(0, createdWallets.length - 1)];
        const code = `XPOT-${draw.drawDate.toISOString().slice(0, 10)}-${randInt(
          100000,
          999999,
        )}-${t + 1}`;

        // Completed draws: a few WON/CLAIMED, most NOT_PICKED
        // Today draw: mostly IN_DRAW
        let status: 'IN_DRAW' | 'NOT_PICKED' | 'WON' | 'CLAIMED' = 'IN_DRAW';
        if (i < COMPLETED_DRAWS) {
          status = t < 3 ? 'CLAIMED' : t < 10 ? 'WON' : 'NOT_PICKED';
        }

        return {
          code,
          walletId: wallet.id,
          walletAddress: wallet.address,
          status,
          drawId: draw.id,
        };
      });

      await prisma.ticket.createMany({ data: rows, skipDuplicates: true });

      const dayTickets = await prisma.ticket.findMany({
        where: { drawId: draw.id },
        select: { id: true, drawId: true },
      });
      createdTickets.push(...dayTickets);

      // Bonus drops
      for (let b = 0; b < BONUS_DROPS_PER_DRAW[i]; b++) {
        await prisma.bonusDrop.create({
          data: {
            drawId: draw.id,
            label: `Bonus XPOT #${b + 1}`,
            amountXpot: randInt(25_000, 150_000),
            scheduledAt: new Date(
              draw.drawDate.getTime() + (10 + b * 15) * 60 * 1000,
            ),
            status: i < COMPLETED_DRAWS ? 'FIRED' : 'SCHEDULED',
          },
        });
      }
    }

    // Winners for completed draws (1 main + 3 bonus each)
    const createdWinners = [];
    for (let i = 0; i < COMPLETED_DRAWS; i++) {
      const draw = draws[i];

      const tickets = await prisma.ticket.findMany({
        where: { drawId: draw.id },
        select: { id: true, code: true, walletAddress: true },
        take: 2000,
      });

      if (tickets.length === 0) continue;

      const pick = () => tickets[randInt(0, tickets.length - 1)];

      // MAIN
      const main = pick();
      createdWinners.push(
        await prisma.winner.create({
          data: {
            drawId: draw.id,
            ticketId: main.id,
            date: draw.drawDate,
            ticketCode: main.code,
            walletAddress: main.walletAddress,
            jackpotUsd: randInt(150, 450),
            payoutUsd: randInt(150, 450),
            isPaidOut: true,
            txUrl: fakeTxUrl(),
            kind: 'MAIN',
            label: 'Main XPOT',
          },
        }),
      );

      // BONUS winners
      for (let b = 0; b < BONUS_WINNERS_PER_COMPLETED_DRAW; b++) {
        const bt = pick();
        createdWinners.push(
          await prisma.winner.create({
            data: {
              drawId: draw.id,
              ticketId: bt.id,
              date: draw.drawDate,
              ticketCode: bt.code,
              walletAddress: bt.walletAddress,
              jackpotUsd: 0,
              payoutUsd: randInt(20, 120),
              isPaidOut: true,
              txUrl: fakeTxUrl(),
              kind: 'BONUS',
              label: `Bonus XPOT #${b + 1}`,
            },
          }),
        );
      }
    }

    return NextResponse.json({
      ok: true,
      seeded: true,
      force,
      created: {
        draws: draws.length,
        users: createdUsers.length,
        wallets: createdWallets.length,
        tickets: createdTickets.length,
        winners: createdWinners.length,
      },
      notes: [
        `Draw dates: ${days.map((d) => d.toISOString().slice(0, 10)).join(', ')}`,
        `Tickets per draw: ${TICKETS_PER_DRAW.join(' + ')} = ${TICKETS_PER_DRAW.reduce(
          (a, b) => a + b,
          0,
        )}`,
      ],
    });
  } catch (err: any) {
    console.error('[dev-seed] failed', err);
    return NextResponse.json(
      {
        ok: false,
        error: 'SEED_FAILED',
        message: err?.message ?? 'Unknown error',
        detail: typeof err === 'object' ? (err?.stack ?? err) : String(err),
      },
      { status: 500 },
    );
  }
}
