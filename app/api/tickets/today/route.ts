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

    // Find today's draw and include tickets
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

    const tickets = draw.tickets.map((t) => ({
      id: t.id,
      code: t.code,
      status: t.status,          // assumes enum/string on the model
      label: t.label ?? '',
      jackpotUsd: t.jackpotUsd ?? draw.jackpotUsd ?? 10000,
      createdAt: t.createdAt,
      walletAddress: t.walletAddress,
    }));

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
