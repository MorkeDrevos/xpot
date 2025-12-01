// app/api/admin/draw/today/tickets/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'

function isAuthorized(req: NextRequest) {
  const token =
    req.headers.get('x-admin-token') ||
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  return token === process.env.XPOT_ADMIN_TOKEN;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { ok: false, error: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  try {
    const today = new Date().toISOString().slice(0, 10);

    const draw = await prisma.draw.findFirst({
      where: {
        drawDate: {
          gte: new Date(today),
          lt: new Date(today + 'T23:59:59.999Z'),
        },
      },
    });

    if (!draw) {
      return NextResponse.json({ ok: true, tickets: [] });
    }

    const tickets = await prisma.ticket.findMany({
      where: { drawId: draw.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        wallet: true,
      },
    });

    return NextResponse.json({
      ok: true,
      tickets: tickets.map(t => ({
        id: t.id,
        code: t.code,
        walletAddress: t.wallet.address,
        status: t.status,
        createdAt: t.createdAt,
      })),
    });

  } catch (err) {
    console.error('[ADMIN TODAY TICKETS]', err);
    return NextResponse.json(
      { ok: false, error: 'FAILED_TO_LOAD_TICKETS' },
      { status: 500 }
    );
  }
}
