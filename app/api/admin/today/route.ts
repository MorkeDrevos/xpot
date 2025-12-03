// app/api/admin/today/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../_auth';

type DrawStatus = 'open' | 'closed' | 'completed';

function getUtcDayRange(date = new Date()) {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  const d = date.getUTCDate();

  const start = new Date(Date.UTC(y, m, d, 0, 0, 0, 0));
  const end = new Date(Date.UTC(y, m, d + 1, 0, 0, 0, 0));
  return { start, end };
}

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  const { start, end } = getUtcDayRange();

  const draw = await prisma.draw.findFirst({
    where: {
      drawDate: {
        gte: start,
        lt: end,
      },
    },
    include: {
      tickets: true,
    },
  });

  if (!draw) {
    return NextResponse.json({
      ok: true,
      today: null,
    });
  }

  let status: DrawStatus = 'open';
  if (draw.resolvedAt) status = 'completed';
  else if (draw.isClosed) status = 'closed';

  const today = {
    id: draw.id,
    date: draw.drawDate.toISOString(),
    status,
    jackpotUsd: draw.jackpotUsd ?? 0,
    rolloverUsd: 0, // placeholder – adjust when you add rollover logic
    ticketsCount: draw.tickets.length,
    closesAt: null as string | null, // no explicit "closesAt" field in schema yet
  };

  return NextResponse.json({
    ok: true,
    today,
  });
}
