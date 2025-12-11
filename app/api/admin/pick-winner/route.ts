// app/api/admin/draw/pick-winner/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/app/api/admin/_auth';

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

    // 1) Find today's OPEN draw (by drawDate)
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

    // 2) If there is already a MAIN winner for this draw, return it
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
      const payload = {
        ticketId: existingWinner.ticketId,
        code: existingWinner.ticket.code,
        wallet: existingWinner.ticket.wallet?.address ?? '',
        jackpotUsd: 0, // adjust if you later add a jackpot field somewhere else
      };

      return NextResponse.json(
        {
          ok: true,
          winner: payload,
          alreadyExisted: true,
        },
        { status: 200 },
      );
    }

    // 3) Load all IN_DRAW tickets for this draw
    const tickets = await prisma.ticket.findMany({
      where: {
        drawId: draw.id,
        status: 'IN_DRAW',
      },
      include: {
        wallet: true,
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

    // 5) Persist changes in a transaction:
    //    - mark ticket as WON
    //    - mark draw as completed
    //    - create a MAIN Winner row
    const [updatedTicket, updatedDraw, winner] = await prisma.$transaction([
      prisma.ticket.update({
        where: { id: winningTicket.id },
        data: { status: 'WON' },
      }),
      prisma.draw.update({
        where: { id: draw.id },
        data: { status: 'completed' },
      }),
      prisma.winner.create({
        data: {
          drawId: draw.id,
          ticketId: winningTicket.id,
          kind: 'MAIN',
          isPaidOut: false,
        },
      }),
    ]);

    const payload = {
      ticketId: updatedTicket.id,
      code: updatedTicket.code,
      wallet: winningTicket.wallet?.address ?? '',
      jackpotUsd: 0, // adjust when you wire actual XPOT amount here
      winnerId: winner.id,
    };

    return NextResponse.json(
      {
        ok: true,
        winner: payload,
        alreadyExisted: false,
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error('[XPOT] /admin/draw/pick-winner error:', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
