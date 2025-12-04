// app/api/admin/tickets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../_auth';
import { prisma } from '@/lib/prisma';

type TicketStatusApi =
  | 'in-draw'
  | 'expired'
  | 'not-picked'
  | 'won'
  | 'claimed';

function mapStatus(status: string): TicketStatusApi {
  switch (status) {
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

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    // Today as UTC day range
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
    const startOfDay = new Date(`${todayStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${todayStr}T23:59:59.999Z`);

    // Find the *latest* draw for today and include its tickets
    const draw = await prisma.draw.findFirst({
      where: {
        drawDate: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
      orderBy: {
        drawDate: 'desc',
      },
      include: {
        tickets: {
          orderBy: { createdAt: 'desc' },
          include: {
            wallet: true, // Wallet relation for wallet.address
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

    const tickets = draw.tickets.map((t) => ({
      id: t.id,
      code: t.code,
      walletAddress: t.wallet?.address ?? '(unknown wallet)',
      status: mapStatus(t.status),
      createdAt: t.createdAt.toISOString(),
      // Ticket model has no jackpotUsd column – keep this as null
      // so frontend can treat it as optional if needed.
      jackpotUsd: null as number | null,
    }));

    return NextResponse.json({ ok: true, tickets });
  } catch (err: any) {
    console.error('[ADMIN] /tickets error', err);
    return NextResponse.json(
      {
        ok: false,
        error: err.message || 'FAILED_TO_LOAD_TICKETS',
      },
      { status: 500 },
    );
  }
}
