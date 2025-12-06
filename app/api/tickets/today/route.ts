// app/api/tickets/today/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Today in UTC
    const now = new Date();
    const yyyy = now.getUTCFullYear();
    const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(now.getUTCDate()).padStart(2, '0');

    const start = new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`);
    const end = new Date(`${yyyy}-${mm}-${dd}T23:59:59.999Z`);

    // Find today's draw and include tickets (no custom select to avoid TS complaints)
    const draw = await prisma.draw.findFirst({
      where: {
        drawDate: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { drawDate: 'asc' },
      include: {
        tickets: true,
      },
    });

    if (!draw) {
      return NextResponse.json({
        ok: true,
        draw: null,
        tickets: [],
      });
    }

    // Map Prisma tickets to the shape your dashboard expects
    const tickets = draw.tickets.map((rawTicket) => {
      const t: any = rawTicket; // relax typing so we can read walletAddress if present

      return {
        id: t.id,
        code: t.code,
        status: t.status,
        // Ticket model has no "label" column – we just provide a default text
        label: 'Ticket for today’s draw',
        // Ticket model also has no "jackpotUsd" – use draw jackpot or default
        jackpotUsd: draw.jackpotUsd ?? 10_000,
        createdAt: t.createdAt,
        // Try common field names, otherwise empty string
        walletAddress:
          t.walletAddress ??
          t.wallet_address ??
          t.wallet?.address ??
          '',
      };
    });

    return NextResponse.json({
      ok: true,
      draw: {
        id: draw.id,
        drawDate: draw.drawDate,
        status: draw.status,
        jackpotUsd: draw.jackpotUsd,
        rolloverUsd: draw.rolloverUsd,
      },
      tickets,
    });
  } catch (err) {
    console.error('GET /api/tickets/today error', err);
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
