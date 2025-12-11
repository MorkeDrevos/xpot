// app/api/admin/draw/pick-winner/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/app/api/admin/_auth';

export const dynamic = 'force-dynamic';

function getTodayRange() {
  const todayStr = new Date().toISOString().slice(0, 10);
  const start = new Date(`${todayStr}T00:00:00.000Z`);
  const end = new Date(`${todayStr}T23:59:59.999Z`);
  return { start, end };
}

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    const { start, end } = getTodayRange();

    // 1) Find today's draw
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

    // 2) If MAIN winner already exists, return it
    const existingMain = await prisma.winner.findFirst({
      where: {
        drawId: draw.id,
        kind: 'MAIN',
      },
      include: {
        ticket: {
          include: { wallet: true },
        },
      },
    });

    if (existingMain) {
      const t = existingMain.ticket;
      const walletAddress =
        existingMain.walletAddress ||
        t.walletAddress ||
        t.wallet?.address ||
        '';

      return NextResponse.json(
        {
          ok: true,
          winner: {
            winnerId: existingMain.id,
            ticketId: t.id,
            code: existingMain.ticketCode,
            wallet: walletAddress,
            jackpotUsd: existingMain.jackpotUsd ?? 0,
            isPaidOut: existingMain.isPaidOut,
          },
        },
        { status: 200 },
      );
    }

    // 3) Load all IN_DRAW tickets
    const tickets = await prisma.ticket.findMany({
      where: {
        drawId: draw.id,
        status: 'IN_DRAW',
      },
      include: { wallet: true },
    });

    if (!tickets.length) {
      return NextResponse.json(
        { ok: false, error: 'NO_TICKETS_IN_DRAW' },
        { status: 400 },
      );
    }

    // 4) Pick random winner
    const index = Math.floor(Math.random() * tickets.length);
    const winningTicket = tickets[index];
    const now = new Date();

    const walletAddress =
      winningTicket.walletAddress || winningTicket.wallet?.address || '';

    // 5) Persist changes
    const [updatedTicket, updatedDraw, newWinner] = await prisma.$transaction([
      prisma.ticket.update({
        where: { id: winningTicket.id },
        data: { status: 'WON' },
      }),

      prisma.draw.update({
        where: { id: draw.id },
        data: { status: 'completed' },
      }),

      prisma.wwinner.create({
        data: {
          drawId: draw.id,
          ticketId: winningTicket.id,
          date: now,
          ticketCode: winningTicket.code,
          walletAddress,
          jackpotUsd: 0,
          payoutUsd: 0,
          isPaidOut: false,
          kind: 'MAIN',
        },
      }),
    ]);

    return NextResponse.json(
      {
        ok: true,
        winner: {
          winnerId: newWinner.id,
          ticketId: updatedTicket.id,
          code: updatedTicket.code,
          wallet: walletAddress,
          jackpotUsd: newWinner.jackpotUsd,
        },
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error('[XPOT] ERROR /admin/pick-winner:', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
