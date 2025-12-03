// app/api/admin/pick-winner/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../_auth';

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    // Today in UTC
    const todayStr = new Date().toISOString().slice(0, 10);

    const draw = await prisma.draw.findFirst({
      where: {
        drawDate: {
          gte: new Date(`${todayStr}T00:00:00.000Z`),
          lt: new Date(`${todayStr}T23:59:59.999Z`),
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

    if (draw.tickets.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'NO_TICKETS_TODAY' },
        { status: 400 },
      );
    }

    // Pick random ticket
    const ticket =
      draw.tickets[Math.floor(Math.random() * draw.tickets.length)];

    // Create reward (ONLY fields that exist in schema)
    const reward = await prisma.reward.create({
      data: {
        drawId: draw.id,
        ticketId: ticket.id,
        payoutUsd: draw.jackpotUsd ?? 0,
        isPaidOut: false,
      },
      include: {
        ticket: true,
      },
    });

    // Close draw
    await prisma.draw.update({
      where: { id: draw.id },
      data: { isClosed: true },
    });

    return NextResponse.json({
      ok: true,
      winner: {
        id: reward.id,
        drawId: reward.drawId,
        date: new Date().toISOString(),
        ticketCode: ticket.code,
        walletAddress: ticket.walletAddress,
        payoutUsd: reward.payoutUsd,
        isPaidOut: reward.isPaidOut,

        // UI-only — not stored in DB
        kind: 'main',
        label: 'Main jackpot',
      },
    });
  } catch (err) {
    console.error('[ADMIN PICK WINNER ERROR]', err);
    return NextResponse.json(
      { ok: false, error: 'FAILED_TO_PICK_WINNER' },
      { status: 500 },
    );
  }
}
