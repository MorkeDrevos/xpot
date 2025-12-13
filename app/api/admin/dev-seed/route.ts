// app/api/admin/dev-seed/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../_auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ───────────────── helpers ─────────────────

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomWalletAddress() {
  const chars =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789';
  let s = '';
  for (let i = 0; i < 44; i++) s += chars[randInt(0, chars.length - 1)];
  return s;
}

function todayUtcStart() {
  const now = new Date();
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      0,
      0,
      0,
      0,
    ),
  );
}

// ───────────────── route ─────────────────

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const now = new Date();
  const drawDate = todayUtcStart();

  // ─────────── user ───────────
  const user = await prisma.user.create({ data: {} });

  // ─────────── draw ───────────
  let draw = await prisma.draw.findFirst({ where: { drawDate } });

  if (!draw) {
    draw = await prisma.draw.create({
      data: {
        drawDate,
        status: 'open',
        closesAt: new Date(now.getTime() + 90 * 60 * 1000), // +1.5h
        rolloverUsd: randInt(0, 500),
      } as any,
    });
  }

  // ─────────── cleanup ───────────
  await prisma.ticket.deleteMany({ where: { drawId: draw.id } });
  await prisma.bonusDrop?.deleteMany?.({});
  await prisma.winner?.deleteMany?.({});

  // ─────────── wallets ───────────
  const walletCount = randInt(6, 12);
  const wallets = [];

  for (let i = 0; i < walletCount; i++) {
    const address = randomWalletAddress();

    const wallet = await prisma.wallet.upsert({
      where: { address } as any,
      update: {},
      create: { address } as any,
    });

    wallets.push(wallet);
  }

  // ─────────── tickets ───────────
  const tickets: any[] = [];
  const ticketCount = randInt(25, 60);

  for (let i = 0; i < ticketCount; i++) {
    const wallet = wallets[randInt(0, wallets.length - 1)];

    const ticket = await prisma.ticket.create({
      data: {
        drawId: draw.id,
        userId: user.id,
        walletId: wallet.id,
        status: 'IN_DRAW',
        createdAt: new Date(now.getTime() - randInt(1, 90) * 60_000),
      } as any,
    });

    tickets.push(ticket);
  }

  // ─────────── winners ───────────
  const winnerCount = randInt(2, 4);
  const winnerTickets = tickets.slice(0, winnerCount);

  for (const ticket of winnerTickets) {
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        status: 'WINNER',
        payoutXpot: randInt(250_000, 1_500_000),
        paidAt: now,
      } as any,
    });
  }

  // ─────────── bonuses ───────────
  if (prisma.bonusDrop) {
    await prisma.bonusDrop.createMany({
      data: [
        {
          label: 'Community Boost',
          amountXpot: 250_000,
          scheduledAt: new Date(now.getTime() - 60 * 60 * 1000),
          firedAt: new Date(now.getTime() - 55 * 60 * 1000),
          status: 'FIRED',
        },
        {
          label: 'XPOT Power Hour',
          amountXpot: 500_000,
          scheduledAt: new Date(now.getTime() + 2 * 60 * 60 * 1000),
          status: 'SCHEDULED',
        },
      ] as any,
    });
  }

  return NextResponse.json({
    ok: true,
    drawId: draw.id,
    wallets: walletCount,
    tickets: ticketCount,
    winners: winnerCount,
    bonuses: 2,
    note: 'Dev seed completed successfully',
  });
}
