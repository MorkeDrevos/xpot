// app/api/admin/bonus/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../_auth';

export async function GET(req: NextRequest) {
  await requireAdmin(req);

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10); // YYYY-MM-DD

  const startOfDay = new Date(`${todayStr}T00:00:00.000Z`);
  const endOfDay = new Date(`${todayStr}T23:59:59.999Z`);

  // Load today’s draw using drawDate
  const draw = await prisma.draw.findFirst({
    where: {
      drawDate: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
    include: {
      tickets: true,
    },
  });

  if (!draw) {
    return NextResponse.json(
      { ok: false, error: 'NO_DRAW_TODAY' },
      { status: 400 }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      drawId: draw.id,
      drawDate: draw.drawDate.toISOString(),
      status: draw.status,
      ticketsCount: draw.tickets.length,
    },
    { status: 200 }
  );
}
