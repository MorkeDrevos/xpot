// app/api/tickets/history/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const walletAddress = url.searchParams.get('wallet')?.trim();

    if (!walletAddress) {
      return NextResponse.json({ tickets: [] }, { status: 200 });
    }

    const wallet = await prisma.wallet.findUnique({
      where: { address: walletAddress },
    });

    if (!wallet) {
      return NextResponse.json({ tickets: [] }, { status: 200 });
    }

    const tickets = await prisma.ticket.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      include: {
        draw: true,
        wallet: true,
      },
    });

    const formatted = tickets.map(ticket => ({
      id: ticket.id,
      code: ticket.code,
      status: ticket.draw?.isClosed
        ? ticket.draw?.winnerTicketId === ticket.id
          ? 'won'
          : 'not-picked'
        : 'in-draw',
      label: "Today's main jackpot • $10,000",
      jackpotUsd: "$10,000",
      createdAt: ticket.createdAt.toISOString(),
      walletAddress: ticket.wallet.address,
      drawDate: ticket.draw?.drawDate?.toISOString() ?? null,
    }));

    return NextResponse.json({ tickets: formatted }, { status: 200 });
  } catch (err) {
    console.error('History API error:', err);
    return NextResponse.json({ tickets: [] }, { status: 500 });
  }
}
