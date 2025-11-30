// app/api/tickets/history/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

const JACKPOT_USD = 10_000;

type HistoryStatus = 'in-draw' | 'expired' | 'not-picked' | 'won' | 'claimed';

type HistoryEntry = {
  id: string;
  code: string;
  status: HistoryStatus;
  label: string;
  jackpotUsd: number;
  createdAt: string;
  walletAddress: string;
  drawDate: string | null;
};

// Map Prisma TicketStatus → HistoryStatus
function mapStatus(status: string | null | undefined): HistoryStatus {
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

// Map Prisma Ticket + Draw to history entry
function toHistoryEntry(ticket: any): HistoryEntry {
  const createdAt =
    ticket.createdAt instanceof Date
      ? ticket.createdAt.toISOString()
      : new Date(ticket.createdAt).toISOString();

  const drawDate =
    ticket.draw?.drawDate instanceof Date
      ? ticket.draw.drawDate.toISOString()
      : ticket.draw?.drawDate
      ? new Date(ticket.draw.drawDate).toISOString()
      : null;

  const status: HistoryStatus = mapStatus(ticket.status);

  return {
    id: ticket.id,
    code: ticket.code,
    status,
    label: "Today's main jackpot • $10,000",
    jackpotUsd: JACKPOT_USD,
    createdAt,
    walletAddress: ticket.wallet?.address ?? 'unknown',
    drawDate,
  };
}

// GET /api/tickets/history?wallet=ADDRESS
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const walletParam = url.searchParams.get('wallet')?.trim() ?? '';

    if (!walletParam) {
      return NextResponse.json(
        { tickets: [], error: 'Missing wallet parameter' },
        { status: 400 }
      );
    }

    // Find wallet row
    const wallet = await prisma.wallet.findUnique({
      where: { address: walletParam },
    });

    if (!wallet) {
      // No tickets yet for this wallet
      return NextResponse.json({ tickets: [] }, { status: 200 });
    }

    const ticketsDb = await prisma.ticket.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      include: {
        wallet: true,
        draw: true,
      },
    });

    const tickets: HistoryEntry[] = ticketsDb.map(toHistoryEntry);

    return NextResponse.json({ tickets }, { status: 200 });
  } catch (err) {
    console.error('Error in /api/tickets/history', err);
    return NextResponse.json(
      { tickets: [], error: 'Internal error' },
      { status: 500 }
    );
  }
}
