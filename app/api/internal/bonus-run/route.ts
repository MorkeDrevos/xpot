// app/api/internal/bonus-run/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const INTERNAL_HEADER = 'x-xpot-internal-key';

function isAuthed(req: NextRequest) {
  const expected = process.env.XPOT_INTERNAL_CRON_KEY ?? '';
  const incoming = req.headers.get(INTERNAL_HEADER) ?? '';
  if (!expected) return false;
  return incoming === expected;
}

function pickRandom<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) {
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const now = new Date();

  // Fetch due drops (limit for safety)
  const dueDrops = await prisma.bonusDrop.findMany({
    where: {
      status: 'SCHEDULED',
      scheduledAt: { lte: now },
    },
    orderBy: { scheduledAt: 'asc' },
    take: 25,
    include: {
      draw: true,
    },
  });

  if (dueDrops.length === 0) {
    return NextResponse.json({ ok: true, fired: 0, now: now.toISOString() });
  }

  let fired = 0;

  for (const drop of dueDrops) {
    try {
      await prisma.$transaction(async tx => {
        // Re-check inside transaction (prevents double-fire if cron overlaps)
        const fresh = await tx.bonusDrop.findUnique({ where: { id: drop.id } });
        if (!fresh || fresh.status !== 'SCHEDULED') return;

        // Need tickets in that draw to pick from
        const tickets = await tx.ticket.findMany({
          where: {
            drawId: drop.drawId,
            status: 'IN_DRAW',
          },
          select: {
            id: true,
            code: true,
            walletAddress: true,
          },
          take: 20000,
        });

        if (tickets.length === 0) {
          // No tickets - mark as cancelled or fired (your choice)
          await tx.bonusDrop.update({
            where: { id: drop.id },
            data: { status: 'CANCELLED' },
          });
          return;
        }

        const winnerTicket = pickRandom(tickets);

        // Create bonus winner row
        await tx.winner.create({
          data: {
            drawId: drop.drawId,
            ticketId: winnerTicket.id,
            date: now,
            ticketCode: winnerTicket.code,
            walletAddress: winnerTicket.walletAddress,
            jackpotUsd: 0,
            payoutUsd: drop.amountXpot, // you use payoutUsd as XPOT amount in UI
            isPaidOut: false,
            kind: 'BONUS',
            label: drop.label,
          },
        });

        // Mark drop fired
        await tx.bonusDrop.update({
          where: { id: drop.id },
          data: { status: 'FIRED' },
        });
      });

      fired += 1;
    } catch (e) {
      // Don’t crash the whole run, just continue
      console.error('[bonus-run] failed firing drop', drop.id, e);
    }
  }

  return NextResponse.json({
    ok: true,
    fired,
    now: now.toISOString(),
  });
}
