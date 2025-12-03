// app/api/admin/tickets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../_auth';

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    const todayStr = new Date().toISOString().slice(0, 10);

    const draw = await prisma.draw.findFirst({
      where: {
        drawDate: {
          gte: new Date(`${todayStr}T00:00:00.000Z`),
          lt:  new Date(`${todayStr}T23:59:59.999Z`),
        },
      },
      include: {
        tickets: {
          include: {
            wallet: true,
          },
          orderBy: { createdAt: 'desc' },
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
      walletAddress: t.wallet.address,
      status: t.status
        .toLowerCase()
        .replace('_', '-') as
        | 'in-draw'
        | 'won'
        | 'claimed'
        | 'not-picked'
        | 'expired',
      createdAt: t.createdAt.toISOString(),
    }));

    return NextResponse.json({
      ok: true,
      tickets,
    });
  } catch (err) {
    console.error('[ADMIN] /tickets error', err);
    return NextResponse.json(
      { ok: false, error: 'FAILED_TO_LOAD_TICKETS' },
      { status: 500 },
    );
  }
}
