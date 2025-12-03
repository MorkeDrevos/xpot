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

    // If winner already set, don’t re-roll
    if (draw.winnerTicketId) {
      return NextResponse.json(
        { ok: false, error: 'WINNER_ALREADY_PICKED' },
        { status: 400 },
      );
    }

    // Only tickets that are actually in the draw
    const eligibleTickets = draw.tickets.filter(
      (t) => t.status === 'IN_DRAW',
    );

    if (eligibleTickets.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'NO_TICKETS_TODAY' },
        { status: 400 },
      );
    }

    // Pick random ticket
    const winnerTicket =
      eligibleTickets[Math.floor(Math.random() * eligibleTickets.length)];

    // Create reward row for the main jackpot
    const reward = await prisma.reward.create({
      data: {
        // Adjust enum values if needed – this assumes RewardKind { MAIN, BONUS }
        kind: 'MAIN',
        label: 'Main jackpot',
        amountUsd: draw.jackpotUsd ?? 0,
        draw: { connect: { id: draw.id } },
        ticket: { connect: { id: winnerTicket.id } },
        wallet: { connect: { id: winnerTicket.walletId } },
        // isPaidOut defaults to false
      },
      include: {
        ticket: {
          include: {
            wallet: true,
            draw: true,
          },
        },
      },
    });

    // Close draw + store winner ticket
    await prisma.draw.update({
      where: { id: draw.id },
      data: {
        isClosed: true,
        winnerTicketId: winnerTicket.id,
        resolvedAt: new Date(),
      },
    });

    const winnerPayload = {
      id: reward.id,
      drawId: reward.ticket.drawId,
      date: reward.ticket.draw.drawDate.toISOString(),
      ticketCode: reward.ticket.code,
      walletAddress: reward.ticket.wallet.address,
      jackpotUsd: reward.ticket.draw.jackpotUsd ?? 0,
      payoutUsd: reward.amountUsd ?? reward.ticket.draw.jackpotUsd ?? 0,
      isPaidOut: reward.isPaidOut,
      txUrl: reward.txUrl ?? null,
      kind: 'main',
      label: reward.label ?? 'Main jackpot',
    };

    return NextResponse.json({
      ok: true,
      winner: winnerPayload,
    });
  } catch (err) {
    console.error('[ADMIN] /pick-winner error', err);
    return NextResponse.json(
      { ok: false, error: 'FAILED_TO_PICK_WINNER' },
      { status: 500 },
    );
  }
}
