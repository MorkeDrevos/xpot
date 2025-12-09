// app/api/admin/dev-seed/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../_auth';
import { TicketStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

// Shared seeding logic so GET and POST can both call it
async function runSeed() {
  const now = new Date();

  // Today range (00:00 -> tomorrow 00:00)
  const startOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const endOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
  );

  // 1) Ensure we have a draw for today (by drawDate)
  let draw = await prisma.draw.findFirst({
    where: {
      drawDate: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
  });

  if (!draw) {
    draw = await prisma.draw.create({
      data: {
        drawDate: startOfDay,
        jackpotUsd: 1000, // simple dev default
      },
    });
  }

  // 2) If this draw has no tickets yet, seed a few
  const existingTickets = await prisma.ticket.count({
    where: { drawId: draw.id },
  });

  let created = 0;

  if (existingTickets === 0) {
    // Dev user + wallet for seeded tickets
    const devUser = await prisma.user.upsert({
      where: { xHandle: 'xpot_dev_seed' },
      update: {},
      create: {
        xHandle: 'xpot_dev_seed',
      },
    });

    const devWallet = await prisma.wallet.upsert({
      where: { address: 'DevWallet11111111111111111111111111111111' },
      update: {
        userId: devUser.id,
      },
      create: {
        address: 'DevWallet11111111111111111111111111111111',
        userId: devUser.id,
      },
    });

    await prisma.ticket.createMany({
      data: [
        {
          code: 'XPOT-DEV-AAAA-BBBB',
          status: TicketStatus.IN_DRAW,
          createdAt: now,
          drawId: draw.id,
          userId: devUser.id,
          walletId: devWallet.id,
        },
        {
          code: 'XPOT-DEV-CCCC-DDDD',
          status: TicketStatus.IN_DRAW,
          createdAt: new Date(now.getTime() - 5 * 60 * 1000),
          drawId: draw.id,
          userId: devUser.id,
          walletId: devWallet.id,
        },
        {
          code: 'XPOT-DEV-EEEE-FFFF',
          status: TicketStatus.IN_DRAW,
          createdAt: new Date(now.getTime() - 10 * 60 * 1000),
          drawId: draw.id,
          userId: devUser.id,
          walletId: devWallet.id,
        },
      ],
    });

    created = 3;
  }

  return NextResponse.json({
    ok: true,
    message: 'Dev seed done',
    draw,
    createdTickets: created,
  });
}

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    return await runSeed();
  } catch (error: any) {
    console.error('DEV SEED ERROR', error);
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || 'UNKNOWN_ERROR',
      },
      { status: 500 },
    );
  }
}

// 👇 New: allow GET so you can just open in browser
export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    return await runSeed();
  } catch (error: any) {
    console.error('DEV SEED ERROR', error);
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || 'UNKNOWN_ERROR',
      },
      { status: 500 },
    );
  }
}
