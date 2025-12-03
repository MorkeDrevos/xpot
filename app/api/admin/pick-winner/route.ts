// app/api/admin/pick-winner/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../_auth';

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    // Today as YYYY-MM-DD string
    const todayStr = new Date().toISOString().slice(0, 10);

    // Find today's open draw with its tickets
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

    // Pick a random ticket from today's draw
    const randomIndex = Math.floor(Math.random() * draw.tickets.length);
    const ticket = draw.tickets[randomIndex];

    // Close the draw + create reward in one transaction
    const { updatedDraw, reward } = await prisma.$transaction(async tx => {
      const updatedDraw = await tx.draw.update({
        where: { id: draw.id },
        data: {
          isClosed: true,
          resolvedAt: new Date(),
        },
      });

      const reward = await tx.reward.create({
        data: {
          drawId: updatedDraw.id,
          ticketId: ticket.id,
          amountUsd: draw.jackpotUsd ?? 0, // use today's jackpot as payout
          isPaidOut: false,
          label: 'Main jackpot',
        },
      });

      return { updatedDraw, reward };
    });

    // Fetch wallet to get the on-chain address (Ticket only has walletId)
    const wallet = await prisma.wallet.findUnique({
      where: { id: ticket.walletId },
      select: { address: true },
    });

    return NextResponse.json({
      ok: true,
      winner: {
        id: reward.id,
        drawId: updatedDraw.id,
        date: updatedDraw.drawDate.toISOString(),
        ticketCode: ticket.code,
        // If for some reason wallet is missing, fall back to walletId
        walletAddress: wallet?.address ?? ticket.walletId,
        jackpotUsd: updatedDraw.jackpotUsd ?? 0,
        payoutUsd: reward.amountUsd,
        isPaidOut: reward.isPaidOut,
        txUrl: null,          // placeholder for future TX link
        kind: 'main',         // UI-only
        label: 'Main jackpot', // UI-only
      },
    });
  } catch (err) {
    console.error('[ADMIN] pick-winner error', err);
    return NextResponse.json(
      { ok: false, error: 'FAILED_TO_PICK_WINNER' },
      { status: 500 },
    );
  }
}
