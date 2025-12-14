// app/api/admin/dev-seed/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/app/api/admin/_auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// -----------------------------------------------------------------------------// Dev-only gate
// -----------------------------------------------------------------------------
function isDevRequest(req: Request) {
  const host = (req.headers.get('host') || '').toLowerCase();
  const vercelEnv = (process.env.VERCEL_ENV || '').toLowerCase(); // 'production' | 'preview' | 'development'

  // Hard block production
  if (vercelEnv === 'production') return false;

  // Allow dev subdomain, localhost, or preview deployments
  if (host.startsWith('dev.') || host.includes('localhost') || vercelEnv === 'preview') return true;

  // Otherwise: block (tighten)
  return false;
}

// -----------------------------------------------------------------------------// Random demo generators
// -----------------------------------------------------------------------------
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
  return randomBase58(44); // Solana-ish
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

// -----------------------------------------------------------------------------// Optional models (won't crash if your schema doesn't have them)
// -----------------------------------------------------------------------------
function getOptionalModel<T = any>(key: string): T | null {
  const p: any = prisma as any;
  return p && p[key] ? (p[key] as T) : null;
}

// -----------------------------------------------------------------------------// Route
// -----------------------------------------------------------------------------
export async function POST(req: Request) {
  // Auth
  const denied = requireAdmin(req);
  if (denied) return denied;

  // Dev-only
  if (!isDevRequest(req)) {
    return NextResponse.json(
      {
        ok: false,
        error: 'DEV_ONLY',
        message: 'Dev seed is disabled outside dev/preview/localhost.',
      },
      { status: 403 },
    );
  }

  const url = new URL(req.url);
  const force = url.searchParams.get('force') === '1';

  const now = new Date();
  const start = startOfUtcDay(now);
  const end = endOfUtcDay(now);

  // Optional models
  const bonusDropModel = getOptionalModel<any>('bonusDrop');
  const winnerModel = getOptionalModel<any>('winner');

  try {
    // "Empty DB" check (global)
    const [drawCount, ticketCount, bonusCount, winnerCount] = await Promise.all([
      prisma.draw.count(),
      prisma.ticket.count(),
      bonusDropModel?.count?.().catch(() => 0) ?? Promise.resolve(0),
      winnerModel?.count?.().catch(() => 0) ?? Promise.resolve(0),
    ]);

    const isEmpty = drawCount === 0 && ticketCount === 0 && bonusCount === 0 && winnerCount === 0;

    if (!force && !isEmpty) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        message: 'DB is not empty - skipping seed (use ?force=1 to override).',
        counts: { drawCount, ticketCount, bonusCount, winnerCount },
      });
    }

    // Ensure today's draw exists
    let draw = await prisma.draw.findFirst({
      where: { drawDate: { gte: start, lt: end } },
    });

    // If force, wipe today's demo rows (prevents unique constraints + duplicates)
    if (force && draw) {
      // tickets always exist
      await prisma.ticket.deleteMany({ where: { drawId: draw.id } });

      // optional: winners / bonus drops
      if (winnerModel?.deleteMany) {
        await winnerModel.deleteMany({ where: { drawId: draw.id } }).catch(() => {});
      }
      if (bonusDropModel?.deleteMany) {
        await bonusDropModel.deleteMany({ where: { drawId: draw.id } }).catch(() => {});
      }
    }

    if (!draw) {
      draw = await prisma.draw.create({
        data: {
          drawDate: start,
          status: 'open', // keep aligned with your UI types
          jackpotUsd: 229.64,
          rolloverUsd: 0,
          ticketsCount: 0,
          closesAt: new Date(Date.now() + 60 * 60 * 1000), // +1h
        } as any,
      });
    } else if (force) {
      // refresh the draw stats on force
      await prisma.draw.update({
        where: { id: draw.id },
        data: {
          status: 'open',
          jackpotUsd: 229.64,
          rolloverUsd: 0,
          ticketsCount: 0,
          closesAt: new Date(Date.now() + 60 * 60 * 1000),
        } as any,
      });
    }

    // Create demo tickets
    const ticketRows = Array.from({ length: 10 }).map((_, i) => ({
      drawId: draw!.id,
      code: `XPOT-${randInt(100000, 999999)}-${i + 1}`,
      walletAddress: fakeWallet(),
      status: 'in-draw',
      jackpotUsd: 229.64,
      createdAt: new Date(Date.now() - randInt(2, 40) * 60 * 1000),
    }));

    await prisma.ticket.createMany({ data: ticketRows as any });

    // Update ticketsCount on draw
    const newTicketCount = await prisma.ticket.count({ where: { drawId: draw!.id } });
    await prisma.draw.update({
      where: { id: draw!.id },
      data: { ticketsCount: newTicketCount } as any,
    });

    // Create a scheduled bonus drop (if model exists)
    if (bonusDropModel?.create) {
      await bonusDropModel
        .create({
          data: {
            drawId: draw!.id,
            label: 'Bonus XPOT',
            amountXpot: 100000,
            scheduledAt: new Date(Date.now() + 15 * 60 * 1000), // +15m
            status: 'SCHEDULED',
          },
        })
        .catch(() => {});
    }

    // Create a fake "paid" winner (if model exists)
    if (winnerModel?.create) {
      const firstTicket = await prisma.ticket.findFirst({ where: { drawId: draw!.id } });
      if (firstTicket) {
        await winnerModel
          .create({
            data: {
              drawId: draw!.id,
              date: start,
              ticketCode: firstTicket.code,
              walletAddress: firstTicket.walletAddress,
              jackpotUsd: 229.64,
              payoutUsd: 1000000, // your UI uses payoutUsd as XPOT amount display
              isPaidOut: true,
              txUrl: fakeTxUrl(),
              kind: 'main',
              label: 'Main XPOT',
            },
          })
          .catch(() => {});
      }
    }

    // Return counts so UI can show something meaningful
    const [todayTickets, todayWinners, todayBonuses] = await Promise.all([
      prisma.ticket.count({ where: { drawId: draw!.id } }),
      winnerModel?.count?.({ where: { drawId: draw!.id } }).catch(() => 0) ?? Promise.resolve(0),
      bonusDropModel?.count?.({ where: { drawId: draw!.id } }).catch(() => 0) ?? Promise.resolve(0),
    ]);

    return NextResponse.json({
      ok: true,
      seeded: true,
      force,
      drawId: draw!.id,
      today: { tickets: todayTickets, winners: todayWinners, bonusDrops: todayBonuses },
    });
  } catch (err: any) {
    // IMPORTANT: always return JSON (so your UI shows a real error message)
    const message =
      err?.message ||
      (typeof err === 'string' ? err : 'Unknown error while seeding demo data');

    // Prisma errors sometimes hide useful parts in meta
    const detail =
      err?.code || err?.name || err?.meta || err?.cause || undefined;

    return NextResponse.json(
      {
        ok: false,
        error: 'SEED_FAILED',
        message,
        detail,
      },
      { status: 500 },
    );
  }
}
