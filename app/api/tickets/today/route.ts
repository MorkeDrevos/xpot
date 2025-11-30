// app/api/tickets/today/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

const JACKPOT_USD = 10_000;

type EntryStatus = 'in-draw' | 'expired' | 'not-picked' | 'won' | 'claimed';

type Entry = {
  id: string;
  code: string;
  status: EntryStatus;
  label: string;
  jackpotUsd: string;
  createdAt: string;
  walletAddress: string;
};

// Map Prisma TicketStatus → EntryStatus
function mapStatus(status: string | null | undefined): EntryStatus {
  switch (status) {
    case 'WON':
      return 'won';
    case 'CLAIMED':
      return 'claimed';
    case 'NOT_PICKED':
      return 'not-picked';
    case 'EXPIRED':
      return 'expired';
    case 'IN_DRAW':
    default:
      return 'in-draw';
  }
}

// Map Prisma Ticket + Draw to dashboard Entry
function toEntry(ticket: any, draw: any): Entry {
  const createdAt =
    ticket.createdAt instanceof Date
      ? ticket.createdAt.toISOString()
      : new Date(ticket.createdAt).toISOString();

  return {
    id: ticket.id,
    code: ticket.code,
    status: mapStatus(ticket.status),
    label: "Today's main jackpot • $10,000",
    jackpotUsd: `$${JACKPOT_USD.toLocaleString()}`,
    createdAt,
    walletAddress: ticket.wallet?.address ?? 'unknown',
  };
}

// GET /api/tickets/today
export async function GET() {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const draw = await prisma.draw.findFirst({
      where: {
        drawDate: {
          gte: start,
          lte: end,
        },
      },
    });

    if (!draw) {
      return NextResponse.json({ tickets: [] }, { status: 200 });
    }

    const ticketsDb = await prisma.ticket.findMany({
      where: { drawId: draw.id },
      orderBy: { createdAt: 'desc' },
      include: {
        wallet: true,
      },
    });

    const entries: Entry[] = ticketsDb.map(t => toEntry(t, draw));

    return NextResponse.json(
      {
        tickets: entries,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('Error in /api/tickets/today', err);
    return NextResponse.json(
      { tickets: [], error: 'Internal error' },
      { status: 500 }
    );
  }
}
