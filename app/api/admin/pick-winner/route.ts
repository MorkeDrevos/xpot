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

    if (!draw.tickets || draw.tickets.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'NO_TICKETS_TODAY' },
        { status: 400 },
      );
    }

    // Pick random ticket from today's draw
    const ticket =
      draw.tickets[Math.floor(Math.random() * draw.tickets.length)];

    // Close draw + set winnerTicketId
    const updatedDraw = await prisma.draw.update({
      where: { id: draw.id },
      data: {
        isClosed: true,
        resolvedAt: new Date(),
        winnerTicketId: ticket.id,
      },
    });

    // Create reward row (DB fields only)
    const reward = await prisma.reward.create({
      data: {
        drawId: draw.id,
        ticketId: ticket.id,
        walletId: ticket.walletId,
        amountUsd: draw.jackpotUsd ?? 0, // <- FIX: use amountUsd (schema field)
        isPaidOut: false,
      },
      include: {
        ticket: true,
      },
    });

    // Response for admin UI (can include extra UI-only fields)
    return NextResponse.json({
      ok: true,
      winner: {
        id: reward.id,
        drawId: draw.id,
        date: draw.drawDate.toISOString(),
        ticketCode: ticket.code,
        walletAddress: ticket.walletId, // or ticket.wallet.address if you include wallet
        jackpotUsd: draw.jackpotUsd ?? 0,
        payoutUsd: reward.amountUsd,
        isPaidOut: reward.isPaidOut,
        txUrl: reward.txUrl ?? null,
        kind: 'main',
        label: 'Main jackpot',
      },
    });
  } catch (err) {
    console.error('[ADMIN] FAILED_TO_PICK_WINNER', err);
    return NextResponse.json(
      { ok: false, error: 'FAILED_TO_PICK_WINNER' },
      { status: 500 },
    );
  }
}
