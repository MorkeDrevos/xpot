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

    // 1) Find today's open draw
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

    // 2) Load in-draw tickets
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

    // 3) Guard if already resolved
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

      const winnerPayload = {
        id: `draw-${draw.id}`,
        drawId: draw.id,
        date: draw.drawDate.toISOString(),
        ticketCode: winnerTicket.code,
        walletAddress: winnerTicket.wallet?.address ?? '',
        payoutXpot: draw.jackpotUsd ?? 0,
        isPaidOut: Boolean(draw.paidAt),
        txUrl: draw.payoutTx ?? null,
        kind: 'main' as const,
        label: "Today's XPOT",
        xHandle: winnerTicket.user?.xHandle ?? null,
        xAvatarUrl: winnerTicket.user?.xAvatarUrl ?? null,
      };

      return NextResponse.json({ ok: true, winner: winnerPayload });
    }

    // 4) Pick random ticket
    const winningTicket = tickets[Math.floor(Math.random() * tickets.length)];
    const now = new Date();

    // 5) Persist everything
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
          payoutXpot: draw.jackpotUsd ?? 0,
          isPaidOut: false,
        },
      }),
    ]);

    // 6) Final API payload
    const winnerPayload = {
      id: reward.id,
      drawId: updatedDraw.id,
      date: updatedDraw.drawDate.toISOString(),
      ticketCode: updatedTicket.code,
      walletAddress: winningTicket.wallet?.address ?? '',
      payoutXpot: reward.payoutXpot,
      isPaidOut: reward.isPaidOut,
      txUrl: reward.txUrl ?? null,
      kind: 'main' as const,
      label: reward.label,
      xHandle: winningTicket.user?.xHandle ?? null,
      xAvatarUrl: winningTicket.user?.xAvatarUrl ?? null,
    };

    return NextResponse.json({ ok: true, winner: winnerPayload });
  } catch (err: any) {
    console.error('[XPOT] pick-winner error:', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
