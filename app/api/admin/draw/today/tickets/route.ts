// app/api/admin/draw/today/tickets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function isAuthorized(req: NextRequest) {
  const header =
    req.headers.get('x-admin-token') ||
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  if (!header || header !== process.env.XPOT_ADMIN_TOKEN) {
    return false;
  }

  return true;
}

function mapStatus(status: string): string {
  switch (status) {
    case 'IN_DRAW':
      return 'in-draw';
    case 'WON':
      return 'won';
    case 'CLAIMED':
      return 'claimed';
    case 'NOT_PICKED':
      return 'not-picked';
    case 'EXPIRED':
      return 'expired';
    default:
      return 'in-draw';
  }
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { ok: false, error: 'UNAUTHORIZED' },
      { status: 401 },
    );
  }

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

  const draw = await prisma.draw.findFirst({
    where: {
      drawDate: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
  });

  if (!draw) {
    return NextResponse.json({ ok: true, tickets: [] });
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
    status: mapStatus(t.status),
    createdAt: t.createdAt.toISOString(),
  }));

  return NextResponse.json({
    ok: true,
    tickets: mapped,
  });
}
