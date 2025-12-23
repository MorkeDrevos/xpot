// app/api/admin/pick-bonus-winner/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/app/api/admin/_auth';
import { WinnerKind } from '@prisma/client';
import { randomInt } from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  try {
    const body = await req.json();
    const { drawId, label, amountXpot } = body as {
      drawId: string;
      label: string;
      amountXpot: number;
    };

    if (!drawId || !label || !amountXpot) {
      return NextResponse.json({ ok: false, error: 'INVALID_INPUT' }, { status: 400 });
    }

    // Visible "EXECUTING" (briefly)
    await prisma.draw.update({ where: { id: drawId }, data: { status: 'drawing' } });

    const tickets = await prisma.ticket.findMany({
      where: { drawId, status: 'IN_DRAW' },
      select: { id: true, code: true, walletAddress: true },
      orderBy: { id: 'asc' }, // stable
    });

    if (tickets.length === 0) {
      await prisma.draw.update({ where: { id: drawId }, data: { status: 'open' } });
      return NextResponse.json({ ok: false, error: 'NO_ELIGIBLE_TICKETS' }, { status: 400 });
    }

    const picked = tickets[randomInt(0, tickets.length)];

    const winner = await prisma.$transaction(async (tx) => {
      const w = await tx.winner.create({
        data: {
          drawId,
          ticketId: picked.id,
          ticketCode: picked.code,
          walletAddress: picked.walletAddress,
          kind: WinnerKind.BONUS,
          label,
          payoutUsd: amountXpot, // UI treats this as XPOT amount
          jackpotUsd: 0,
          isPaidOut: false,
        },
      });

      await tx.draw.update({ where: { id: drawId }, data: { status: 'open' } });
      return w;
    });

    return NextResponse.json({ ok: true, winner });
  } catch (err: any) {
    console.error('[pick-bonus-winner]', err);
    return NextResponse.json(
      { ok: false, error: 'PICK_BONUS_FAILED', message: err?.message ?? 'Unknown error' },
      { status: 500 },
    );
  }
}
