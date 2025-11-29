import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // 1) Get the latest draw (most recent by drawDate)
    const latestDraw = await prisma.draw.findFirst({
      orderBy: { drawDate: 'desc' },
      include: {
        tickets: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!latestDraw) {
      // No draws yet → just return empty list for now
      return NextResponse.json({
        ok: true,
        draw: null,
        tickets: [] as any[],
      });
    }

    const tickets = latestDraw.tickets.map(t => {
      // Map DB -> dashboard Entry type
      const status: 'in-draw' | 'expired' | 'not-picked' | 'won' | 'claimed' =
        latestDraw.isClosed
          ? latestDraw.winnerTicketId === t.id
            ? 'won'
            : 'not-picked'
          : 'in-draw';

      return {
        id: t.id,
        code: t.code,
        status,
        label: "Today's main jackpot • $10,000",
        jackpotUsd: '$10,000',
        createdAt: t.createdAt.toISOString(),
      };
    });

    return NextResponse.json({
      ok: true,
      draw: {
        id: latestDraw.id,
        drawDate: latestDraw.drawDate.toISOString(),
        isClosed: latestDraw.isClosed,
        winnerTicketId: latestDraw.winnerTicketId,
      },
      tickets,
    });
  } catch (error) {
    console.error('GET /api/tickets/today error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: (error as Error)?.message || 'Unknown server error',
      },
      { status: 500 },
    );
  } finally {
    // Optional – fine to keep since this route is short-lived
    await prisma.$disconnect();
  }
}
