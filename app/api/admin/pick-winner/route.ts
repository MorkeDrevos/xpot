// app/api/admin/draw/pick-winner/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/app/api/admin/_auth';
import { ensureActiveDraw } from '@/lib/ensureActiveDraw';

export const dynamic = 'force-dynamic';

const DAILY_XPOT = 1_000_000;

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    // Always target the same "active draw" logic the live endpoint uses
    const draw = await ensureActiveDraw(new Date());

    if (!draw) {
      return NextResponse.json({ ok: false, error: 'NO_ACTIVE_DRAW' }, { status: 400 });
    }

    if ((draw.status ?? '').toLowerCase() !== 'open') {
      return NextResponse.json(
        { ok: false, error: 'DRAW_NOT_OPEN', status: draw.status },
        { status: 400 },
      );
    }

    // If a MAIN winner already exists, return it (idempotent)
    const existingWinner = await prisma.winner.findFirst({
      where: { drawId: draw.id, kind: 'MAIN' },
      include: { ticket: { include: { wallet: true } } },
      orderBy: [{ date: 'desc' }, { id: 'desc' }],
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
            kind: existingWinner.kind ?? 'MAIN',
            isPaidOut: existingWinner.isPaidOut,
          },
        },
        { status: 200 },
      );
    }

    // Pull eligible tickets
    const tickets = await prisma.ticket.findMany({
      where: { drawId: draw.id, status: 'IN_DRAW' },
      include: { wallet: true },
    });

    if (!tickets.length) {
      return NextResponse.json({ ok: false, error: 'NO_TICKETS_IN_DRAW' }, { status: 400 });
    }

    // Pick randomly
    const winningTicket = tickets[Math.floor(Math.random() * tickets.length)];

    // In your UI, payoutUsd is used as XPOT amount
    const jackpotUsd = 0;
    const payoutUsd = DAILY_XPOT;

    const [updatedTicket, newWinner] = await prisma.$transaction([
      prisma.ticket.update({
        where: { id: winningTicket.id },
        data: { status: 'WON' },
      }),
      prisma.winner.create({
        data: {
          drawId: draw.id,
          ticketId: winningTicket.id,
          ticketCode: winningTicket.code,
          walletAddress: winningTicket.walletAddress,
          date: new Date(),
          jackpotUsd,
          payoutUsd,
          isPaidOut: false,
          kind: 'MAIN',
          label: 'Main XPOT winner',
        },
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
          kind: newWinner.kind ?? 'MAIN',
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
