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

    // Draw + tickets – cast to any to avoid Prisma TS complaints
    const drawRecord = (await prisma.draw.findFirst({
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
    })) as any;

    // No draw today
    if (!drawRecord) {
      return NextResponse.json({
        ok: true,
        draw: null,
        tickets: [],
      });
    }

    // Map tickets into the shape the dashboard expects
    const tickets = (drawRecord.tickets ?? []).map((t: any) => ({
      id: t.id,
      code: t.code,
      status: t.status ?? 'in-draw', // fallback if model has no status
      label: 'Ticket for today’s draw',
      jackpotUsd: drawRecord.jackpotUsd ?? 10_000,
      createdAt: t.createdAt,
      walletAddress:
        t.walletAddress ??
        t.wallet_address ??
        t.wallet?.address ??
        '',
    }));

    return NextResponse.json({
      ok: true,
      draw: {
        id: drawRecord.id,
        drawDate: drawRecord.drawDate,
        status: drawRecord.status ?? 'open',
        jackpotUsd: drawRecord.jackpotUsd ?? 10_000,
        rolloverUsd: drawRecord.rolloverUsd ?? 0,
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
