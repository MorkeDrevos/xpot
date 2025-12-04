// app/api/admin/tickets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../_auth';
import { getTodayDrawWithTickets } from '@/lib/draws';

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
    // Use shared helper – always returns the same "today" draw,
    // and logs if multiple draws exist for today.
    const draw = await getTodayDrawWithTickets();

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
      // Ticket model has no jackpotUsd – keep null so frontend can treat optional.
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
