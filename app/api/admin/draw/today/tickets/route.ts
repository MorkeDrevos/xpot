// app/api/admin/draw/today/tickets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '/vercel/path0/lib/prisma';

function isAuthorized(req: NextRequest): boolean {
  const header =
    req.headers.get('x-admin-token') ||
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  if (!header || header !== process.env.XPOT_ADMIN_TOKEN) return false;
  return true;
}

const statusMap: Record<string, string> = {
  IN_DRAW: 'in-draw',
  WON: 'won',
  CLAIMED: 'claimed',
  NOT_PICKED: 'not-picked',
  EXPIRED: 'expired',
};

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { ok: false, error: 'UNAUTHORIZED' },
      { status: 401 },
    );
  }

  // Same “latest draw” logic as /today
  const draw = await prisma.draw.findFirst({
    orderBy: { drawDate: 'desc' },
  });

  if (!draw) {
    return NextResponse.json({
      ok: true,
      tickets: [],
    });
  }

  const tickets = await prisma.ticket.findMany({
    where: { drawId: draw.id },
    orderBy: { createdAt: 'asc' },
    include: {
      wallet: true,
    },
  });

  const mapped = tickets.map(t => ({
    id: t.id,
    code: t.code,
    walletAddress: t.wallet?.address ?? 'UNKNOWN',
    status: statusMap[t.status] ?? 'in-draw',
    createdAt: t.createdAt.toISOString(),
    jackpotUsd: Number(draw.jackpotUsd ?? 10_000),
  }));

  return NextResponse.json({
    ok: true,
    tickets: mapped,
  });
}
