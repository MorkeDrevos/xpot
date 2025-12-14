// app/api/internal/bonus-run/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const INTERNAL_HEADER = 'x-xpot-internal-key';

function isAuthed(req: NextRequest) {
  const expected = process.env.XPOT_INTERNAL_CRON_KEY ?? '';
  if (!expected) return false;

  const incomingHeader = req.headers.get(INTERNAL_HEADER) ?? '';
  const url = new URL(req.url);
  const incomingQuery = url.searchParams.get('key') ?? '';

  const incoming = incomingHeader || incomingQuery;
  return incoming === expected;
}

function pickRandom<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function getOpsMode(): Promise<'MANUAL' | 'AUTO'> {
  // Optional DB-backed ops mode (safe if schema not deployed yet)
  try {
    const anyPrisma = prisma as any;
    if (anyPrisma?.opsConfig?.findUnique) {
      const row = await anyPrisma.opsConfig.findUnique({
        where: { singleton: 'singleton' },
        select: { mode: true },
      });
      if (row?.mode === 'AUTO') return 'AUTO';
    }
  } catch {
    // ignore
  }

  // Env fallback (optional)
  return process.env.XPOT_OPS_MODE === 'AUTO' ? 'AUTO' : 'MANUAL';
}

async function runEngine(req: NextRequest) {
  if (!isAuthed(req)) {
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const now = new Date();

  const summary = {
    ok: true,
    now: now.toISOString(),
    opsMode: 'MANUAL' as 'MANUAL' | 'AUTO',
    bonus: {
      dueFound: 0,
      fired: 0,
      cancelledNoTickets: 0,
      skippedAlreadyHandled: 0,
      winnersCreated: 0,
    },
    main: {
      eligibleDraws: 0,
      winnersCreated: 0,
      drawsClosed: 0,
      skippedAlreadyHasWinner: 0,
      skippedNoTickets: 0,
    },
  };

  summary.opsMode = await getOpsMode();

  // ─────────────────────────────────────────────────────────────
  // 1) BONUS DROPS: fire due scheduled drops and write Winner rows
  // ─────────────────────────────────────────────────────────────
  const dueDrops = await prisma.bonusDrop.findMany({
    where: {
      status: 'SCHEDULED',
      scheduledAt: { lte: now },
    },
    orderBy: { scheduledAt: 'asc' },
    take: 50, // safety cap per run
    include: { draw: true },
  });

  summary.bonus.dueFound = dueDrops.length;

  for (const drop of dueDrops) {
    // Atomic “claim” of the drop so cron runs are idempotent
    const claimed = await prisma.bonusDrop.updateMany({
      where: { id: drop.id, status: 'SCHEDULED' },
      data: { status: 'FIRED' },
    });

    if (claimed.count === 0) {
      summary.bonus.skippedAlreadyHandled += 1;
      continue;
    }

    // If draw is not open, you can decide policy; keeping it permissive:
    // bonuses can still fire as long as tickets exist in the draw.
    const eligibleTickets = await prisma.ticket.findMany({
      where: {
        drawId: drop.drawId,
        status: 'IN_DRAW',
        // prevent the same ticket from winning multiple BONUS winners
        winners: { none: { drawId: drop.drawId, kind: 'BONUS' } },
      },
      select: {
        id: true,
        code: true,
        walletAddress: true,
      },
      take: 5000, // safety cap
    });

    if (eligibleTickets.length === 0) {
      // No eligible tickets: mark cancelled so it stops showing as pending.
      await prisma.bonusDrop.update({
        where: { id: drop.id },
        data: { status: 'CANCELLED' },
      });
      summary.bonus.cancelledNoTickets += 1;
      continue;
    }

    const chosen = pickRandom(eligibleTickets);

    // Create winner row
    await prisma.$transaction(async tx => {
      // Mark ticket as won (optional but nice for UX)
      await tx.ticket.update({
        where: { id: chosen.id },
        data: { status: 'WON' },
      });

      await tx.winner.create({
        data: {
          drawId: drop.drawId,
          ticketId: chosen.id,
          date: now,
          ticketCode: chosen.code,
          walletAddress: chosen.walletAddress,
          jackpotUsd: 0,
          payoutUsd: drop.amountXpot, // UI uses payoutUsd as XPOT amount
          isPaidOut: false,
          kind: 'BONUS',
          label: drop.label,
        },
      });
    });

    summary.bonus.fired += 1;
    summary.bonus.winnersCreated += 1;
  }

  // ─────────────────────────────────────────────────────────────
  // 2) MAIN DRAW AUTO-PICK (only when ops mode = AUTO)
  // ─────────────────────────────────────────────────────────────
  if (summary.opsMode === 'AUTO') {
    const eligibleDraws = await prisma.draw.findMany({
      where: {
        status: 'open',
        closesAt: { lte: now },
      },
      orderBy: { closesAt: 'asc' },
      take: 10, // safety cap per run
    });

    summary.main.eligibleDraws = eligibleDraws.length;

    for (const draw of eligibleDraws) {
      const already = await prisma.winner.findFirst({
        where: { drawId: draw.id, kind: 'MAIN' },
        select: { id: true },
      });

      if (already) {
        summary.main.skippedAlreadyHasWinner += 1;
        // still close draw to prevent it staying “open forever”
        await prisma.draw.update({
          where: { id: draw.id },
          data: { status: 'closed' },
        });
        summary.main.drawsClosed += 1;
        continue;
      }

      const eligibleTickets = await prisma.ticket.findMany({
        where: {
          drawId: draw.id,
          status: 'IN_DRAW',
        },
        select: {
          id: true,
          code: true,
          walletAddress: true,
        },
        take: 5000,
      });

      if (eligibleTickets.length === 0) {
        summary.main.skippedNoTickets += 1;
        // close anyway so automation doesn’t loop on empty draws
        await prisma.draw.update({
          where: { id: draw.id },
          data: { status: 'closed' },
        });
        summary.main.drawsClosed += 1;
        continue;
      }

      const chosen = pickRandom(eligibleTickets);

      await prisma.$transaction(async tx => {
        await tx.ticket.update({
          where: { id: chosen.id },
          data: { status: 'WON' },
        });

        await tx.winner.create({
          data: {
            drawId: draw.id,
            ticketId: chosen.id,
            date: now,
            ticketCode: chosen.code,
            walletAddress: chosen.walletAddress,
            jackpotUsd: 0,
            payoutUsd: 0, // set later by your payout logic (or set to XPOT pool size if you want)
            isPaidOut: false,
            kind: 'MAIN',
            label: 'Main XPOT',
          },
        });

        await tx.draw.update({
          where: { id: draw.id },
          data: { status: 'closed' },
        });
      });

      summary.main.winnersCreated += 1;
      summary.main.drawsClosed += 1;
    }
  }

  return NextResponse.json(summary);
}

export async function GET(req: NextRequest) {
  return runEngine(req);
}

export async function POST(req: NextRequest) {
  return runEngine(req);
}
