// app/api/admin/pick-winner/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/app/api/admin/_auth';
import { randomInt } from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// UTC day bucket (matches your schema intent)
function utcDayStart(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
}

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    const today = utcDayStart(new Date());

    const draw = await prisma.draw.findUnique({
      where: { drawDate: today },
    });

    if (!draw || draw.status !== 'open') {
      return NextResponse.json(
        { ok: false, error: 'NO_OPEN_DRAW_FOR_TODAY' },
        { status: 400 },
      );
    }

    // If a MAIN winner already exists for this draw, return it
    const existingWinner = await prisma.winner.findFirst({
      where: { drawId: draw.id, kind: 'MAIN' },
      include: { ticket: { include: { wallet: true } } },
      orderBy: { date: 'desc' },
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

    // Set visible "EXECUTING" state
    await prisma.draw.update({
      where: { id: draw.id },
      data: { status: 'drawing' },
    });

    // Load eligible tickets
    const tickets = await prisma.ticket.findMany({
      where: { drawId: draw.id, status: 'IN_DRAW' },
      include: { wallet: true },
      orderBy: { id: 'asc' }, // stable order
    });

    if (!tickets.length) {
      await prisma.draw.update({ where: { id: draw.id }, data: { status: 'open' } });
      return NextResponse.json(
        { ok: false, error: 'NO_TICKETS_IN_DRAW' },
        { status: 400 },
      );
    }

    const randomIndex = randomInt(0, tickets.length); // crypto-safe
    const winningTicket = tickets[randomIndex];

    const jackpotUsd = 0; // you can wire this later
    const payoutUsd = jackpotUsd;

    const [, updatedTicket, newWinner] = await prisma.$transaction([
      prisma.draw.update({ where: { id: draw.id }, data: { status: 'completed' } }),
      prisma.ticket.update({ where: { id: winningTicket.id }, data: { status: 'WON' } }),
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
    console.error('[XPOT] /admin/pick-winner error:', err);

    // best-effort: don't leave draw stuck in drawing
    try {
      const today = utcDayStart(new Date());
      const draw = await prisma.draw.findUnique({ where: { drawDate: today } });
      if (draw?.status === 'drawing') {
        await prisma.draw.update({ where: { id: draw.id }, data: { status: 'open' } });
      }
    } catch {}

    return NextResponse.json(
      { ok: false, error: err?.message || 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
