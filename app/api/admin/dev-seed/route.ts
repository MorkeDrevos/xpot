// app/api/admin/dev-seed/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../_auth';

export const dynamic = 'force-dynamic';

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomWallet() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789';
  let s = '';
  for (let i = 0; i < 44; i++) s += chars[randInt(0, chars.length - 1)];
  return s;
}

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  // Always seed "today" draw (open)
  const today = new Date();
  const yyyy = today.getUTCFullYear();
  const mm = String(today.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(today.getUTCDate()).padStart(2, '0');
  const drawDate = `${yyyy}-${mm}-${dd}T00:00:00.000Z`;

  // Ensure draw exists
  const draw =
    (await prisma.draw.findFirst({
      where: { drawDate: new Date(drawDate) },
      include: { tickets: true, winners: true },
    })) ??
    (await prisma.draw.create({
      data: {
        drawDate: new Date(drawDate),
        status: 'open',
        jackpotUsd: 0,
        rolloverUsd: 0,
        closesAt: new Date(Date.now() + 6 * 60 * 60 * 1000), // +6h
      },
    }));

  // Create tickets
  const ticketCount = randInt(5, 18);
  const tickets = [];
  for (let i = 0; i < ticketCount; i++) {
    tickets.push({
      drawId: draw.id,
      wallet: randomWallet(),
      status: 'IN_DRAW',
    });
  }

  // Clear existing tickets/winners for a clean seed run
  await prisma.winner.deleteMany({ where: { drawId: draw.id } });
  await prisma.ticket.deleteMany({ where: { drawId: draw.id } });

  await prisma.ticket.createMany({ data: tickets });

  // Pick a winner
  const all = await prisma.ticket.findMany({
    where: { drawId: draw.id },
    orderBy: { createdAt: 'asc' },
  });

  const picked = all[randInt(0, all.length - 1)];

  // Mark winner ticket + create Winner row
  await prisma.ticket.update({
    where: { id: picked.id },
    data: { status: 'WON' },
  });

  await prisma.winner.create({
    data: {
      drawId: draw.id,
      ticketId: picked.id,
      wallet: picked.wallet,
      kind: 'MAIN',
      amountXpot: 1_000_000,
      amountUsd: 0,
      status: 'SENT',
      txSig: `DEV-SEED-${yyyy}${mm}${dd}-${randInt(100, 999)}`,
    },
  });

  return NextResponse.json({
    ok: true,
    drawId: draw.id,
    seededTickets: all.length,
    winnerWallet: picked.wallet,
  });
}
