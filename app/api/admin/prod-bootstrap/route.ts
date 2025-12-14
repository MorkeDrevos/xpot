// app/api/admin/prod-bootstrap/route.ts
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../_auth';

// -----------------------------
// helpers
// -----------------------------
function todayUtcStart(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Looks like a Solana base58-ish string (not real, just realistic)
function randomSolanaLikeAddress() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789';
  let s = '';
  for (let i = 0; i < 44; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function randomHandle() {
  const left = [
    'CandleChaser','LatencyLord','AlphaSmith','SolHermit','NebulaNox','XPOTMaxi','ChartWarden',
    'TradeWizard','BlockByBlock','LoopMode','HypeEngineer','SignalSeeker','MintHunter','WhaleWhisper',
  ];
  const right = ['_', '', '', 'x', 'SOL', '777', '22', '420', 'OG', 'dev', 'pro', 'max'];
  return `${left[randInt(0, left.length - 1)]}${right[randInt(0, right.length - 1)]}${randInt(10, 999)}`;
}

type Body = {
  confirm?: string; // must equal "BOOTSTRAP_PROD"
  wallets?: number; // default 40, max 80
  ticketsPerWallet?: number; // default 2, max 10  (total tickets = wallets * ticketsPerWallet)
  winners?: number; // default 6, max 20
  bonusDrops?: number; // default 4, max 20
  bonusAmountMin?: number; // default 25000
  bonusAmountMax?: number; // default 250000
};

const MARKER_LABEL = '__PROD_BOOTSTRAP_DONE__';

export async function POST(req: NextRequest) {
  // Admin auth (your single source of truth)
  const denied = requireAdmin(req);
  if (denied) return denied;

  const body = (await req.json().catch(() => ({}))) as Body;

  // Hard confirm gate
  if ((body.confirm ?? '') !== 'BOOTSTRAP_PROD') {
    return NextResponse.json(
      {
        ok: false,
        error: 'CONFIRM_REQUIRED',
        message: 'Pass { confirm: "BOOTSTRAP_PROD" } to run production bootstrap.',
      },
      { status: 400 },
    );
  }

  // Optional extra “arming” flag (recommended). If you don’t want it, delete this block.
  // Set XPOT_PROD_BOOTSTRAP_ARMED=true in Vercel (Production env) then remove after use.
  const armed = (process.env.XPOT_PROD_BOOTSTRAP_ARMED ?? '').toLowerCase();
  if (armed !== 'true') {
    return NextResponse.json(
      {
        ok: false,
        error: 'NOT_ARMED',
        message:
          'Set env XPOT_PROD_BOOTSTRAP_ARMED=true (Production) to allow bootstrap, then remove it after.',
      },
      { status: 403 },
    );
  }

  // Clamp inputs (safety)
  const wallets = Math.min(Math.max(Number(body.wallets ?? 40), 5), 80);
  const ticketsPerWallet = Math.min(Math.max(Number(body.ticketsPerWallet ?? 2), 1), 10);
  const winners = Math.min(Math.max(Number(body.winners ?? 6), 1), 20);
  const bonusDrops = Math.min(Math.max(Number(body.bonusDrops ?? 4), 0), 20);

  const bonusAmountMin = Math.max(Number(body.bonusAmountMin ?? 25_000), 1);
  const bonusAmountMax = Math.max(Number(body.bonusAmountMax ?? 250_000), bonusAmountMin);

  const drawDate = todayUtcStart();
  const now = new Date();

  // One-time-per-day enforcement:
  // We create a marker BonusDrop row for today’s draw. If it exists, we refuse to run again.
  const result = await prisma.$transaction(async (tx) => {
    // Ensure today's draw exists
    const draw = await tx.draw.upsert({
      where: { drawDate },
      update: {},
      create: {
        drawDate,
        status: 'open',
        closesAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
      },
    });

    const markerExists = await tx.bonusDrop.findFirst({
      where: {
        drawId: draw.id,
        label: MARKER_LABEL,
      },
      select: { id: true },
    });

    if (markerExists) {
      return {
        ok: false as const,
        error: 'ALREADY_BOOTSTRAPPED_TODAY',
        message: 'Prod bootstrap already ran for today (marker exists).',
        drawId: draw.id,
      };
    }

    // Create wallets
    // NOTE: adjust field names if yours differ (address/xHandle/xAvatarUrl/etc).
    const walletRows = Array.from({ length: wallets }).map(() => ({
      address: randomSolanaLikeAddress(),
      xHandle: randomHandle(),
      xAvatarUrl: `https://unavatar.io/x/${encodeURIComponent(randomHandle())}`,
      createdAt: now,
    }));

    const createdWallets: { id: string; address: string }[] = [];
    for (const w of walletRows) {
      // If Wallet.address is unique (likely), we avoid collisions with upsert.
      const created = await tx.wallet.upsert({
        where: { address: w.address },
        update: {},
        create: w as any,
        select: { id: true, address: true },
      });
      createdWallets.push(created);
    }

    // Create tickets for each wallet for today’s draw
    const ticketsToCreate: any[] = [];
    for (const w of createdWallets) {
      for (let i = 0; i < ticketsPerWallet; i++) {
        ticketsToCreate.push({
          drawId: draw.id,
          walletId: w.id,
          status: 'IN_DRAW',
          createdAt: new Date(Date.now() - randInt(1, 120) * 60 * 1000),
        });
      }
    }

    // Bulk create, then fetch back for winner selection
    if (ticketsToCreate.length > 0) {
      await tx.ticket.createMany({ data: ticketsToCreate });
    }

    const allTickets = await tx.ticket.findMany({
      where: { drawId: draw.id },
      select: { id: true, walletId: true },
    });

    // Choose winners from today’s tickets
    const shuffled = [...allTickets].sort(() => Math.random() - 0.5);
    const winnerTickets = shuffled.slice(0, Math.min(winners, shuffled.length));

    // Mark winner tickets as WON
    if (winnerTickets.length) {
      await tx.ticket.updateMany({
        where: { id: { in: winnerTickets.map((t) => t.id) } },
        data: { status: 'WON' },
      });

      // If you have a Winner table (you do), create rows
      // Adjust fields if needed.
      for (const wt of winnerTickets) {
        await tx.winner.create({
          data: {
            drawId: draw.id,
            ticketId: wt.id,
            walletId: wt.walletId,
            // optional extras if your schema has them:
            // amountXpot: ...
            // label: ...
          } as any,
        });
      }
    }

    // Create bonus drops in the next ~2 hours
    const createdBonus: any[] = [];
    for (let i = 0; i < bonusDrops; i++) {
      const mins = randInt(5, 120);
      const amt = randInt(bonusAmountMin, bonusAmountMax);
      const drop = await tx.bonusDrop.create({
        data: {
          drawId: draw.id,
          label: `Bonus XPOT #${i + 1}`,
          amountXpot: amt,
          scheduledAt: new Date(Date.now() + mins * 60 * 1000),
          status: 'SCHEDULED',
        } as any,
      });
      createdBonus.push(drop);
    }

    // Create the marker (prevents running again today)
    await tx.bonusDrop.create({
      data: {
        drawId: draw.id,
        label: MARKER_LABEL,
        amountXpot: 1,
        scheduledAt: new Date(),
        status: 'CANCELLED', // harmless, never fires
      } as any,
    });

    return {
      ok: true as const,
      drawId: draw.id,
      walletsCreated: createdWallets.length,
      ticketsCreated: ticketsToCreate.length,
      winnersCreated: winnerTickets.length,
      bonusDropsCreated: createdBonus.length,
    };
  });

  return NextResponse.json(result);
}
