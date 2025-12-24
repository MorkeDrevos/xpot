// app/api/admin/draw/pick-winner/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/app/api/admin/_auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// UTC day bucket [start, end)
function getTodayRangeUtc() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

export async function POST(req: NextRequest) {
  const authResp = requireAdmin(req);
  if (authResp) return authResp;

  try {
    const { start, end } = getTodayRangeUtc();

    // 1) Find today's open draw
    const draw = await prisma.draw.findFirst({
      where: { drawDate: { gte: start, lt: end }, status: 'open' },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });

    if (!draw) {
      return NextResponse.json({ ok: false, error: 'NO_OPEN_DRAW_FOR_TODAY' }, { status: 400 });
    }

    // 2) If MAIN winner already exists, return it
    const existingWinner = await prisma.winner.findFirst({
      where: { drawId: draw.id, kind: 'MAIN' },
      include: { ticket: { include: { wallet: true } } },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });

    if (existingWinner) {
      return NextResponse.json(
        {
          ok: true,
          winner: {
            ticketId: existingWinner.ticketId,
            code: existingWinner.ticketCode,
            wallet: existingWinner.ticket.wallet?.address ?? existingWinner.walletAddress,
            jackpotUsd: existingWinner.jackpotUsd,
            payoutUsd: existingWinner.payoutUsd,
            kind: existingWinner.kind,
            isPaidOut: existingWinner.isPaidOut,
          },
        },
        { status: 200 },
      );
    }

    // 3) Load IN_DRAW tickets
    const tickets = await prisma.ticket.findMany({
      where: { drawId: draw.id, status: 'IN_DRAW' },
      include: { wallet: true },
    });

    if (!tickets.length) {
      return NextResponse.json({ ok: false, error: 'NO_TICKETS_IN_DRAW' }, { status: 400 });
    }

    // 4) Pick random ticket
    const winningTicket = tickets[Math.floor(Math.random() * tickets.length)];

    // TODO: wire real USD later
    const jackpotUsd = 0;

    // 5) Persist changes atomically
    const [updatedTicket, newWinner] = await prisma.$transaction([
      prisma.ticket.update({
        where: { id: winningTicket.id },
        data: { status: 'WON' },
        select: { id: true, code: true },
      }),
      prisma.winner.create({
        data: {
          drawId: draw.id,
          ticketId: winningTicket.id,
          ticketCode: winningTicket.code,
          walletAddress: winningTicket.walletAddress,
          jackpotUsd,
          payoutUsd: jackpotUsd,
          isPaidOut: false,
          kind: 'MAIN',
          label: 'Main XPOT winner',
        },
        select: { jackpotUsd: true, payoutUsd: true, kind: true, isPaidOut: true },
      }),
    ]);

    return NextResponse.json(
      {
        ok: true,
        winner: {
          ticketId: updatedTicket.id,
          code: updatedTicket.code,
          wallet: winningTicket.wallet?.address ?? winningTicket.walletAddress ?? '',
          jackpotUsd: newWinner.jackpotUsd,
          payoutUsd: newWinner.payoutUsd,
          kind: newWinner.kind,
          isPaidOut: newWinner.isPaidOut,
        },
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error('[XPOT] /admin/draw/pick-winner error:', err);
    return NextResponse.json({ ok: false, error: err?.message || 'INTERNAL_ERROR' }, { status: 500 });
  }
}
