import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../_auth';

export async function POST(req: NextRequest) {
  await requireAdmin(req);

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10); // YYYY-MM-DD

  // Find today's draw (Prisma field is `date`, NOT `drawDate`)
  const draw = await prisma.draw.findFirst({
    where: {
      date: {
        gte: new Date(`${todayStr}T00:00:00Z`),
        lt: new Date(`${todayStr}T23:59:59Z`)
      }
    },
    include: {
      tickets: true
    }
  });

  if (!draw) {
    return NextResponse.json(
      { ok: false, error: 'NO_DRAW_TODAY' },
      { status: 400 }
    );
  }

  if (!draw.tickets.length) {
    return NextResponse.json(
      { ok: false, error: 'NO_TICKETS_TODAY' },
      { status: 400 }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      drawId: draw.id,
      ticketsCount: draw.tickets.length,
    },
    { status: 200 }
  );
}
