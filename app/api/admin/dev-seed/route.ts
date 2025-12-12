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

function todayUtcStart() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
}

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  // Create a throwaway dev user (Ticket.userId is required in your schema)
  const user = await prisma.user.create({ data: {} });

  // Ensure today's draw exists
  const drawDate = todayUtcStart();

  const draw =
    (await prisma.draw.findFirst({
      where: { drawDate },
    })) ??
    (await prisma.draw.create({
      data: {
        drawDate,
        status: 'open',
        closesAt: new Date(Date.now() + 6 * 60 * 60 * 1000), // +6h
      } as any, // in case your Draw has extra optional fields
    }));

  // Clean old tickets for this draw (optional but keeps seeding tidy)
  await prisma.ticket.deleteMany({ where: { drawId: draw.id } });

  // Seed some tickets
  const ticketCount = randInt(5, 18);

  const tickets = Array.from({ length: ticketCount }).map(() => ({
    drawId: draw.id,
    userId: user.id,
    wallet: randomWallet(),
    status: 'IN_DRAW',
  }));

  await prisma.ticket.createMany({ data: tickets });

  return NextResponse.json({
    ok: true,
    drawId: draw.id,
    seededTickets: ticketCount,
    seededUserId: user.id,
  });
}
