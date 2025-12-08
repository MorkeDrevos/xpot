// app/api/dev/seed-demo/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TicketStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const secret = url.searchParams.get('secret');
  const expected = process.env.DEV_RESET_SECRET || 'xpot-dev-reset';

  if (secret !== expected) {
    return NextResponse.json(
      { ok: false, error: 'BAD_SECRET' },
      { status: 401 },
    );
  }

  // Safety guard for prod
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.ALLOW_PROD_RESET !== '1'
  ) {
    return NextResponse.json(
      { ok: false, error: 'SEED_DISABLED_IN_PROD' },
      { status: 403 },
    );
  }

  try {
    const now = new Date();

    const today = new Date(now);
    today.setHours(12, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2);

    // ───────── Demo users + wallets ─────────
    // Minimal users (no Clerk / X info)
    const user1 = await prisma.user.create({ data: {} });
    const user2 = await prisma.user.create({ data: {} });
    const user3 = await prisma.user.create({ data: {} });

    const wallet1 = await prisma.wallet.create({
      data: {
        address: '9uuq6Uch7nEXAMPLEWALLET11111111111111111',
        userId: user1.id,
      },
    });

    const wallet2 = await prisma.wallet.create({
      data: {
        address: '9uuq6Uch7nEXAMPLEWALLET22222222222222222',
        userId: user2.id,
      },
    });

    const wallet3 = await prisma.wallet.create({
      data: {
        address: '9uuq6Uch7nEXAMPLEWALLET33333333333333333',
        userId: user3.id,
      },
    });

    // ───────── TODAY DRAW (EMPTY) ─────────
    const todayDraw = await prisma.draw.create({
      data: {
        drawDate: today,
      },
    });

    // ───────── YESTERDAY (WITH WINNER) ─────────
    const yesterdayDraw = await prisma.draw.create({
      data: {
        drawDate: yesterday,
      },
    });

    // Winner ticket (wallet1)
    const winner = await prisma.ticket.create({
      data: {
        drawId: yesterdayDraw.id,
        code: 'XPOT-ABC-123',
        status: TicketStatus.WON,
        userId: user1.id,
        walletId: wallet1.id,
      },
    });

    // Extra tickets (wallet2 + wallet3)
    await prisma.ticket.createMany({
      data: [
        {
          drawId: yesterdayDraw.id,
          code: 'XPOT-DEF-456',
          status: TicketStatus.NOT_PICKED,
          userId: user2.id,
          walletId: wallet2.id,
        },
        {
          drawId: yesterdayDraw.id,
          code: 'XPOT-GHI-789',
          status: TicketStatus.EXPIRED,
          userId: user3.id,
          walletId: wallet3.id,
        },
      ],
    });

    // Mark winner on the draw
    await prisma.draw.update({
      where: { id: yesterdayDraw.id },
      data: { winnerTicketId: winner.id },
    });

    // ───────── TWO DAYS AGO (HISTORY) ─────────
    const oldDraw = await prisma.draw.create({
      data: {
        drawDate: twoDaysAgo,
      },
    });

    await prisma.ticket.createMany({
      data: [
        {
          drawId: oldDraw.id,
          code: 'XPOT-JKL-111',
          status: TicketStatus.CLAIMED,
          userId: user1.id,
          walletId: wallet1.id,
        },
        {
          drawId: oldDraw.id,
          code: 'XPOT-MNO-222',
          status: TicketStatus.NOT_PICKED,
          userId: user2.id,
          walletId: wallet2.id,
        },
      ],
    });

    return NextResponse.json(
      {
        ok: true,
        draws: {
          today: todayDraw.id,
          yesterday: yesterdayDraw.id,
          twoDaysAgo: oldDraw.id,
        },
      },
      { status: 200 },
    );
  } catch (err) {
    console.error('[XPOT] Seed failed:', err);
    return NextResponse.json(
      { ok: false, error: 'SEED_FAILED' },
      { status: 500 },
    );
  }
}
