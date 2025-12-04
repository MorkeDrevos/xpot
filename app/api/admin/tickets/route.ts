// app/api/admin/tickets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../_auth';

// Frontend-friendly ticket status values
type TicketStatusUi = 'in-draw' | 'expired' | 'not-picked' | 'won' | 'claimed';

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    // Today as UTC day range
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10); // YYYY-MM-DD

    const startOfDay = new Date(`${todayStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${todayStr}T23:59:59.999Z`);

    // Find today's OPEN draw (same idea as /admin/today)
    const draw = await prisma.draw.findFirst({
      where: {
        drawDate: {
          gte: startOfDay,
          lt: endOfDay,
        },
        isClosed: false,
      },
      orderBy: {
        drawDate: 'desc',
      },
    });

    // No open draw → no tickets
    if (!draw) {
      return NextResponse.json({
        ok: true,
        tickets: [],
      });
    }

    // Load all tickets for this draw (newest first), including wallet so we can show address
    const tickets = await prisma.ticket.findMany({
      where: {
        drawId: draw.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        wallet: true,
      },
    });

    const apiTickets = tickets.map((t) => {
      let status: TicketStatusUi;

      switch (t.status) {
        case 'IN_DRAW':
          status = 'in-draw';
          break;
        case 'EXPIRED':
          status = 'expired';
          break;
        case 'NOT_PICKED':
          status = 'not-picked';
          break;
        case 'WON':
          status = 'won';
          break;
        case 'CLAIMED':
          status = 'claimed';
          break;
        default:
          status = 'in-draw';
      }

      return {
        id: t.id,
        code: t.code,
        walletAddress: t.wallet?.address ?? '',
        status,
        createdAt: t.createdAt.toISOString(),
        jackpotUsd: t.jackpotUsd ?? null,
      };
    });

    return NextResponse.json({
      ok: true,
      tickets: apiTickets,
    });
  } catch (err) {
    console.error('[ADMIN] /tickets error', err);
    return NextResponse.json(
      { ok: false, error: 'FAILED_TO_LOAD_TICKETS' },
      { status: 500 },
    );
  }
}
