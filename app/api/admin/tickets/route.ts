// app/api/admin/tickets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '..//_auth';

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
      tickets: {
        include: {
          wallet: true,
        },
      },
    },
  });

  if (!draw) {
    return NextResponse.json({
      ok: true,
      tickets: [],
    });
  }

  const tickets = draw.tickets.map(t => ({
    id: t.id,
    code: t.code,
    walletAddress: t.wallet?.address ?? '',
    // IN_DRAW -> "in-draw", NOT_PICKED -> "not-picked", etc.
    status: t.status.toLowerCase().replace('_', '-') as
      | 'in-draw'
      | 'won'
      | 'claimed'
      | 'not-picked'
      | 'expired',
    createdAt: t.createdAt.toISOString(),
    jackpotUsd: draw.jackpotUsd ?? 0,
  }));

  return NextResponse.json({
    ok: true,
    tickets,
  });
}
