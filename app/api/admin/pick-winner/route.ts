// app/api/admin/pick-winner/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../_auth';

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    const todayStr = new Date().toISOString().slice(0, 10);

    const draw = await prisma.draw.findFirst({
      where: {
        drawDate: {
          gte: new Date(`${todayStr}T00:00:00.000Z`),
          lt: new Date(`${todayStr}T23:59:59.999Z`),
        },
        isClosed: false,
      },
      include: { tickets: true },
    });

    if (!draw) {
      return NextResponse.json({ ok: false, error: 'NO_DRAW_TODAY' }, { status: 400 });
    }

    if (!draw.tickets.length) {
      return NextResponse.json({ ok: false, error: 'NO_TICKETS_TODAY' }, { status: 400 });
    }

    const ticket = draw.tickets[Math.floor(Math.random() * draw.tickets.length)];

    // close draw
    await prisma.draw.update({
      where: { id: draw.id },
      data: {
        isClosed: true,
        resolvedAt: new Date(),
        winnerTicketId: ticket.id,
      },
    });

    // create reward (DB-safe fields only)
const reward = await prisma.reward.create({
  data: {
    drawId: draw.id,
    ticketId: ticket.id,
    amountUsd: draw.jackpotUsd ?? 0,
    isPaidOut: false,
    label: 'Main jackpot', // ✅ required by Prisma schema
  },
  include: {
    ticket: {
      include: {
        wallet: true,
      },
    },
  },
});

    return NextResponse.json({
      ok: true,
      winner: {
        id: reward.id,
        drawId: draw.id,
        date: draw.drawDate.toISOString(),
        ticketCode: ticket.code,
        walletAddress: reward.ticket.wallet.address,
        jackpotUsd: draw.jackpotUsd ?? 0,
        payoutUsd: reward.amountUsd,
        isPaidOut: reward.isPaidOut,
        txUrl: reward.txUrl ?? null,
        kind: 'main',           // UI only
        label: 'Main jackpot',  // UI only
      },
    });
  } catch (err) {
    console.error('[ADMIN] pick-winner failed:', err);
    return NextResponse.json({ ok: false, error: 'FAILED_TO_PICK_WINNER' }, { status: 500 });
  }
}
