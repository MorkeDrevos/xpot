// app/api/tickets/today/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

// Must match the dashboard Entry type
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

// Map Prisma Ticket + Draw -> dashboard Entry
function toEntry(ticket: any, draw: any): Entry {
  const jackpotUsdNumber = draw?.jackpotUsd ?? 10_000; // fallback
  const createdAt =
    ticket?.createdAt instanceof Date
      ? ticket.createdAt.toISOString()
      : new Date(ticket?.createdAt ?? Date.now()).toISOString();

  return {
    id: ticket.id,
    code: ticket.code,
    status: (ticket.status ?? 'in-draw') as EntryStatus,
    label: "Today's main jackpot • $10,000",
    jackpotUsd: `$${Number(jackpotUsdNumber).toLocaleString()}`,
    createdAt,
    walletAddress: ticket.walletAddress,
  };
}

export async function GET() {
  try {
    // Today range in server time
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    // Find today's draw by drawDate
    const draw = await prisma.draw.findFirst({
      where: {
        drawDate: {
          gte: start,
          lte: end,
        },
      },
    });

    if (!draw) {
      // No draw yet today → empty list
      return NextResponse.json(
        {
          ok: true,
          draw: null,
          tickets: [] as Entry[],
        },
        { status: 200 }
      );
    }

    // Load all tickets for this draw
    const ticketsDb = await prisma.ticket.findMany({
      where: { drawId: draw.id },
      orderBy: { createdAt: 'desc' },
    });

    const entries: Entry[] = ticketsDb.map(t => toEntry(t, draw));

    return NextResponse.json(
      {
        ok: true,
        draw: {
          id: draw.id,
          drawDate: draw.drawDate,
        },
        tickets: entries,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('Error in /api/tickets/today', err);
    return NextResponse.json(
      { ok: false, error: 'Internal error', tickets: [] as Entry[] },
      { status: 500 }
    );
  }
}
