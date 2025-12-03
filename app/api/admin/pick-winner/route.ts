// app/api/admin/pick-winner/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../_auth';

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    // Today as YYYY-MM-DD (UTC)
    const todayStr = new Date().toISOString().slice(0, 10);

    const draw = await prisma.draw.findFirst({
      where: {
        drawDate: {
          gte: new Date(`${todayStr}T00:00:00.000Z`),
          lt:  new Date(`${todayStr}T23:59:59.999Z`),
        },
        isClosed: false,
      },
      include: {
        tickets: true,
      },
    });

    if (!draw) {
      return NextResponse.json(
        { ok: false, error: 'NO_DRAW_TODAY' },
        { status: 400 },
      );
    }

    if (!draw.tickets.length) {
      return NextResponse.json(
        { ok: false, error: 'NO_TICKETS_TODAY' },
        { status: 400 },
      );
    }

    // Pick random ticket from today's draw
    const idx = Math.floor(Math.random() * draw.tickets.length);
    const ticket = draw.tickets[idx];

    // Close draw + store winner ticket
    await prisma.draw.update({
      where: { id: draw.id },
      data: {
        isClosed: true,
        resolvedAt: new Date(),
        winnerTicketId: ticket.id,
      },
    });

    // Create reward record (no kind/label in DB – purely view logic)
    const reward = await prisma.reward.create({
      data: {
        amountUsd: draw.jackpotUsd ?? 0,
        draw: { connect: { id: draw.id } },
        ticket: { connect: { id: ticket.id } },
        wallet: { connect: { id: ticket.walletId } },
      },
      include: {
        ticket: true,
        wallet: true,
        draw: true,
      },
    });

    const winner = {
      id: reward.id,
      drawId: draw.id,
      date: draw.drawDate.toISOString(),
      ticketCode: reward.ticket.code,
      walletAddress: reward.wallet.address,
      jackpotUsd: draw.jackpotUsd ?? 0,
      payoutUsd: reward.amountUsd,
      isPaidOut: reward.isPaidOut,
      txUrl: reward.txUrl ?? null,
      // view-only flags for the admin UI
      kind: 'main' as const,
      label: 'Main jackpot',
    };

    return NextResponse.json({
      ok: true,
      winner,
    });
  } catch (err) {
    console.error('[ADMIN] /pick-winner error', err);
    return NextResponse.json(
      { ok: false, error: 'FAILED_TO_PICK_WINNER' },
      { status: 500 },
    );
  }
}
