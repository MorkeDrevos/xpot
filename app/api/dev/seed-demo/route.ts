// app/api/dev/seed-demo/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const secret = url.searchParams.get('secret');
  const expected = process.env.DEV_RESET_SECRET || 'xpot-dev-reset';

  // Same secret as reset route
  if (secret !== expected) {
    return NextResponse.json(
      { ok: false, error: 'BAD_SECRET' },
      { status: 401 }
    );
  }

  // Optional safety: only allow if flag is on in prod
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.ALLOW_PROD_RESET !== '1'
  ) {
    return NextResponse.json(
      { ok: false, error: 'SEED_DISABLED_IN_PROD' },
      { status: 403 }
    );
  }

  try {
    // Today and yesterday helpers
    const now = new Date();
    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      12,
      0,
      0
    );
    const yesterday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 1,
      12,
      0,
      0
    );
    const twoDaysAgo = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 2,
      12,
      0,
      0
    );

    // ─────────────────────────────────────────
    // 1) Today: OPEN draw with no tickets yet
    // ─────────────────────────────────────────
    const todayDraw = await prisma.draw.create({
      data: {
        drawDate: today,
        status: 'open',
        jackpotUsd: 10_000,
        rolloverUsd: 0,
      },
    });

    // ─────────────────────────────────────────
    // 2) Yesterday: COMPLETED draw with a winner
    // ─────────────────────────────────────────
    const yDraw = await prisma.draw.create({
      data: {
        drawDate: yesterday,
        status: 'completed',
        jackpotUsd: 10_000,
        rolloverUsd: 0,
      },
    });

    const wallet1 =
      '9uuq6Uch7nEXAMPLEWALLET1111111111111111111111111';
    const wallet2 =
      '9uuq6Uch7nEXAMPLEWALLET2222222222222222222222222';

    const winnerTicket = await prisma.ticket.create({
      data: {
        drawId: yDraw.id,
        code: 'XPOT-ABC-123',
        walletAddress: wallet1,
        status: 'won',
        label: 'Yesterday’s XPOT draw',
        jackpotUsd: 10_000,
      },
    });

    await prisma.ticket.createMany({
      data: [
        {
          drawId: yDraw.id,
          code: 'XPOT-DEF-456',
          walletAddress: wallet2,
          status: 'not-picked',
          label: 'Yesterday’s XPOT draw',
          jackpotUsd: 10_000,
        },
        {
          drawId: yDraw.id,
          code: 'XPOT-GHI-789',
          walletAddress: wallet2,
          status: 'expired',
          label: 'Yesterday’s XPOT draw',
          jackpotUsd: 10_000,
        },
      ],
    });

    await prisma.draw.update({
      where: { id: yDraw.id },
      data: {
        winningTicketId: winnerTicket.id,
      },
    });

    // ─────────────────────────────────────────
    // 3) Two days ago: COMPLETED draw, rollover
    // ─────────────────────────────────────────
    const oldDraw = await prisma.draw.create({
      data: {
        drawDate: twoDaysAgo,
        status: 'completed',
        jackpotUsd: 5_000,
        rolloverUsd: 5_000,
      },
    });

    await prisma.ticket.createMany({
      data: [
        {
          drawId: oldDraw.id,
          code: 'XPOT-JKL-111',
          walletAddress: wallet1,
          status: 'claimed',
          label: 'Two days ago – early XPOT test draw',
          jackpotUsd: 5_000,
        },
        {
          drawId: oldDraw.id,
          code: 'XPOT-MNO-222',
          walletAddress: wallet2,
          status: 'not-picked',
          label: 'Two days ago – early XPOT test draw',
          jackpotUsd: 5_000,
        },
      ],
    });

    return NextResponse.json({
      ok: true,
      drawsSeeded: [todayDraw.id, yDraw.id, oldDraw.id],
    });
  } catch (err) {
    console.error('[XPOT] Seed demo failed', err);
    return NextResponse.json(
      { ok: false, error: 'SEED_FAILED' },
      { status: 500 }
    );
  }
}
