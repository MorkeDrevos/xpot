// app/api/admin/draw/today/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '/vercel/path0/lib/prisma'; // keep this as in your project

function isAuthorized(req: NextRequest): boolean {
  const header =
    req.headers.get('x-admin-token') ||
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  if (!header || header !== process.env.XPOT_ADMIN_TOKEN) return false;
  return true;
}

// Treat "Today’s XPOT" as the latest draw in DB
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { ok: false, error: 'UNAUTHORIZED' },
      { status: 401 },
    );
  }

  // Latest draw by date
  const draw = await prisma.draw.findFirst({
    orderBy: { drawDate: 'desc' },
  });

  if (!draw) {
    const today = new Date();
    return NextResponse.json({
      ok: true,
      draw: {
        id: 'no-draw',
        date: today.toISOString().slice(0, 10),
        status: 'open',
        jackpotUsd: 10_000,
        rolloverUsd: 0,
        ticketsCount: 0,
      },
    });
  }

  const ticketsCount = await prisma.ticket.count({
    where: { drawId: draw.id },
  });

  const status =
    draw.isClosed && draw.resolvedAt
      ? 'completed'
      : draw.isClosed
      ? 'closed'
      : 'open';

  return NextResponse.json({
    ok: true,
    draw: {
      id: draw.id,
      date: draw.drawDate.toISOString().slice(0, 10),
      status, // "open" | "closed" | "completed"
      jackpotUsd: Number(draw.jackpotUsd ?? 10_000),
      rolloverUsd: 0,
      ticketsCount,
    },
  });
}
