// app/api/admin/pick-winner/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/app/api/admin/_auth';

export const dynamic = 'force-dynamic';

// Helper: today's UTC range (we treat it as Madrid day in the app)
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

    // 2) If a MAIN winner already exists for this draw, just return it
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
      orderBy: { date: 'desc' },
    });

    if (existingWinner) {
      const payload = {
        ticketId: existingWinner.ticketId,
        code: existingWinner.ticketCode,
        wallet:
          existingWinner.ticket.wallet?.address ??
          existingWinner.walletAddress,
        jackpotUsd: existingWinner.jackpotUsd,
        payoutUsd: existingWinner.payoutUsd,
        kind: existingWinner.kind ?? 'MAIN',
        isPaidOut: existingWinner.isPaidOut,
      };

      return NextResponse.json({ ok: true, winner: payload }, { status: 200 });
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

    const jackpotUsd = 0; // placeholder – wire real USD later if you want

    // 5) Persist: mark ticket as WON + create Winner row
    const [updatedTicket, newWinner] = await prisma.$transaction([
      prisma.ticket.update({
        where: { id: winningTicket.id },
        data: { status: 'WON' },
      }),
      prisma.winner.create({
        data: {
          // required relation fields
          drawId: draw.id,
          ticketId: winningTicket.id,

          // required scalar fields from your schema
          ticketCode: winningTicket.code,
          walletAddress: winningTicket.walletAddress,

          // optional fields
          date: new Date(),
          jackpotUsd,
          payoutUsd: jackpotUsd,
          isPaidOut: false,
          kind: 'MAIN',
          label: 'Main XPOT winner',
        },
      }),
    ]);

    const payload = {
      ticketId: updatedTicket.id,
      code: updatedTicket.code,
      wallet:
        winningTicket.wallet?.address ?? winningTicket.walletAddress ?? '',
      jackpotUsd: newWinner.jackpotUsd,
      payoutUsd: newWinner.payoutUsd,
      kind: newWinner.kind ?? 'MAIN',
      isPaidOut: newWinner.isPaidOut,
    };

    return NextResponse.json({ ok: true, winner: payload }, { status: 200 });
  } catch (err: any) {
    console.error('[XPOT] /admin/pick-winner error:', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
