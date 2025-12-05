// app/api/admin/pick-winner/route.ts
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

    // 2) Load all in-draw tickets for this draw (small n per day, fine)
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

    // 3) If draw already has a winnerTicketId, don't pick again
    if (draw.winnerTicketId) {
      // Load the winner ticket & wallet/user so UI still gets a proper object
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

      const pseudoReward = {
        id: `draw-${draw.id}`,
        drawId: draw.id,
        date: draw.drawDate.toISOString(),
        ticketCode: winnerTicket.code,
        walletAddress: winnerTicket.wallet?.address ?? '',
        jackpotUsd: draw.jackpotUsd ?? 0,
        payoutUsd: draw.jackpotUsd ?? 0,
        isPaidOut: false,
        txUrl: null,
        kind: 'main',
        label: "Today's XPOT",
        xHandle: winnerTicket.user?.xHandle ?? null,
        xAvatarUrl: winnerTicket.user?.xAvatarUrl ?? null,
      };

      return NextResponse.json({ ok: true, winner: pseudoReward });
    }

    // 4) Pick a random ticket
    const randomIndex = Math.floor(Math.random() * tickets.length);
    const winningTicket = tickets[randomIndex];

    const now = new Date();

    // 5) Persist everything in a transaction:
    //    - mark ticket as WON
    //    - mark draw as resolved & closed with winnerTicketId
    //    - create a Reward row for the main XPOT payout
    const [updatedTicket, updatedDraw, reward] = await prisma.$transaction([
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
      prisma.reward.create({
        data: {
          drawId: draw.id,
          ticketId: winningTicket.id,
          label: "Today's XPOT",
          amountUsd: draw.jackpotUsd ?? 0,
          isPaidOut: false,
        },
      }),
    ]);

    // 6) Build AdminWinner payload for the frontend
    const winnerPayload = {
      id: reward.id, // used by "mark as paid"
      drawId: updatedDraw.id,
      date: updatedDraw.drawDate.toISOString(),
      ticketCode: updatedTicket.code,
      walletAddress: winningTicket.wallet?.address ?? '',
      jackpotUsd: updatedDraw.jackpotUsd ?? 0,
      payoutUsd: reward.amountUsd,
      isPaidOut: reward.isPaidOut,
      txUrl: reward.txUrl ?? null,
      kind: 'main' as const,
      label: reward.label,
      xHandle: winningTicket.user?.xHandle ?? null,
      xAvatarUrl: winningTicket.user?.xAvatarUrl ?? null,
    };

    return NextResponse.json({
      ok: true,
      winner: winnerPayload,
    });
  } catch (err: any) {
    console.error('[XPOT] pick-winner error:', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
