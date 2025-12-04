// app/api/admin/tickets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../_auth';

type TicketStatusUi = 'in-draw' | 'expired' | 'not-picked' | 'won' | 'claimed';

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    // Today as UTC day range
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const startOfDay = new Date(`${todayStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${todayStr}T23:59:59.999Z`);

    // 🔍 Find the *latest* draw for today (same as /admin/today)
    const draw = await prisma.draw.findFirst({
      where: {
        drawDate: { gte: startOfDay, lt: endOfDay },
      },
      orderBy: {
        drawDate: 'desc',
      },
      include: {
        tickets: true,
      },
    });

    if (!draw) {
      return NextResponse.json({
        ok: true,
        tickets: [],
      });
    }

    // Map DB enum -> UI status strings
    function mapStatus(dbStatus: string): TicketStatusUi {
      switch (dbStatus) {
        case 'IN_DRAW':
          return 'in-draw';
        case 'EXPIRED':
          return 'expired';
        case 'NOT_PICKED':
          return 'not-picked';
        case 'WON':
          return 'won';
        case 'CLAIMED':
          return 'claimed';
        default:
          return 'in-draw';
      }
    }

    const tickets = draw.tickets.map((t) => ({
      id: t.id,
      code: t.code,
      walletAddress: t.walletId ?? '', // or t.walletAddress if you store it
      status: mapStatus(t.status),
      createdAt: t.createdAt.toISOString(),
      jackpotUsd: null as number | null, // reserved for later if you want
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
