// app/api/admin/draw/pick-winner/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/app/api/admin/_auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function getTodayRange() {
  const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const start = new Date(`${todayStr}T00:00:00.000Z`);
  const end = new Date(`${todayStr}T23:59:59.999Z`);
  return { start, end };
}

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    const { start, end } = getTodayRange();

    // 1) Find today's draw that is still open
    //    (schema: drawDate + status)
    const draw = await prisma.draw.findFirst({
      where: {
        drawDate: { gte: start, lt: end },
        status: 'open',
      },
    });

    if (!draw) {
      return NextResponse.json(
        { ok: false, error: 'NO_OPEN_DRAW_FOR_TODAY' },
        { status: 400 },
      );
    }

    // 2) If a MAIN winner already exists for this draw, return it
    const existingWinner = await prisma.winner.findFirst({
      where: {
        drawId: draw.id,
        kind: 'MAIN',
      },
      include: {
        ticket: {
          include: {
            wallet: true,
          },
        },
      },
    });

    if (existingWinner) {
      const t = existingWinner.ticket;
      const payload = {
        ticketId: t.id,
        code: t.code,
        wallet: t.wallet?.address ?? '',
        jackpotUsd: existingWinner.jackpotUsd ?? 0,
      };

      return NextResponse.json({ ok: true, winner: payload });
    }

    // 3) Load all IN_DRAW tickets for this draw
    const tickets = await prisma.ticket.findMany({
      where: {
        drawId: draw.id,
        status: 'IN_DRAW',
      },
      include: {
        wallet: {
          include: {
            user: true, // user hangs off wallet in the new schema
          },
        },
      },
    });

    if (!tickets.length) {
      return NextResponse.json(
        { ok: false, error: 'NO_TICKETS_IN_DRAW' },
        { status: 400 },
      );
    }

    // 4) Pick a random ticket
    const randomIndex = Math.floor(Math.random() * tickets.length);
    const winningTicket = tickets[randomIndex];
    const now = new Date();

    // 5) Persist in one transaction:
    //    - mark ticket as WON
    //    - mark draw as completed
    //    - create Winner row (MAIN)
    const [updatedTicket, updatedDraw, winnerRow] = await prisma.$transaction([
      prisma.ticket.update({
        where: { id: winningTicket.id },
        data: { status: 'WON' },
      }),
      prisma.draw.update({
        where: { id: draw.id },
        data: {
          status: 'completed',
        },
      }),
      prisma.winner.create({
        data: {
          drawId: draw.id,
          ticketId: winningTicket.id,
          date: now,
          ticketCode: winningTicket.code,
          walletAddress: winningTicket.wallet?.address ?? '',
          kind: 'MAIN',
          // jackpotUsd will default to 0 for now; can be updated later by payout logic
        },
      }),
    ]);

    const payload = {
      ticketId: updatedTicket.id,
      code: updatedTicket.code,
      wallet: winningTicket.wallet?.address ?? '',
      jackpotUsd: winnerRow.jackpotUsd ?? 0,
    };

    return NextResponse.json({
      ok: true,
      winner: payload,
    });
  } catch (err: any) {
    console.error('[XPOT] /admin/draw/pick-winner error:', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
