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

    // 1) Find today's draw that is still open / not resolved
    const draw = await prisma.draw.findFirst({
      where: {
        drawDate: { gte: start, lt: end },
        resolvedAt: null,
      },
    });

    if (!draw) {
      return NextResponse.json(
        { ok: false, error: 'NO_OPEN_DRAW_FOR_TODAY' },
        { status: 400 },
      );
    }

    // 2) Load all IN_DRAW tickets for this draw
    const tickets = await prisma.ticket.findMany({
      where: {
        drawId: draw.id,
        status: 'IN_DRAW',
      },
      include: {
        wallet: true,
        user: true,
      },
    });

    if (!tickets.length) {
      return NextResponse.json(
        { ok: false, error: 'NO_TICKETS_IN_DRAW' },
        { status: 400 },
      );
    }

    // 3) If draw already has a winner, just return it (don’t repick)
    if (draw.winnerTicketId) {
      const winnerTicket = await prisma.ticket.findUnique({
        where: { id: draw.winnerTicketId },
        include: { wallet: true, user: true },
      });

      if (!winnerTicket) {
        return NextResponse.json(
          { ok: false, error: 'DRAW_ALREADY_RESOLVED_BUT_TICKET_MISSING' },
          { status: 500 },
        );
      }

      const payload = {
        ticketId: winnerTicket.id,
        code: winnerTicket.code,
        wallet: winnerTicket.wallet?.address ?? '',
        jackpotUsd: draw.jackpotUsd ?? 0,
      };

      return NextResponse.json({ ok: true, winner: payload });
    }

    // 4) Pick a random ticket
    const randomIndex = Math.floor(Math.random() * tickets.length);
    const winningTicket = tickets[randomIndex];

    const now = new Date();

    // 5) Persist: mark ticket as WON + set winnerTicketId on draw
    const [updatedTicket, updatedDraw] = await prisma.$transaction([
      prisma.ticket.update({
        where: { id: winningTicket.id },
        data: { status: 'WON' },
      }),
      prisma.draw.update({
        where: { id: draw.id },
        data: {
          winnerTicketId: winningTicket.id,
          resolvedAt: now,
          isClosed: true,
        },
      }),
    ]);

    const payload = {
      ticketId: updatedTicket.id,
      code: updatedTicket.code,
      wallet: winningTicket.wallet?.address ?? '',
      jackpotUsd: updatedDraw.jackpotUsd ?? 0,
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
