// app/api/today/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function getTodayRange() {
  const todayStr = new Date().toISOString().slice(0, 10);
  const start = new Date(`${todayStr}T00:00:00.000Z`);
  const end = new Date(`${todayStr}T23:59:59.999Z`);
  return { start, end };
}

export async function GET(req: NextRequest) {
  try {
    const { start, end } = getTodayRange();

    const draw = await prisma.draw.findFirst({
      where: {
        drawDate: { gte: start, lt: end },
      },
      include: {
        tickets: true,
        winners: true,
      },
    });

    if (!draw) {
      return NextResponse.json(
        { ok: true, today: null },
        { status: 200 },
      );
    }

    let status: 'open' | 'closed' | 'completed' = 'open';

    if (draw.status === 'closed') status = 'closed';
    else if (draw.status === 'completed') status = 'completed';

    const payload = {
      id: draw.id,
      date: draw.drawDate.toISOString(),
      status,
      jackpotUsd: 0,
      rolloverUsd: 0,
      ticketsCount: draw.tickets.length,
      closesAt: draw.closesAt ? draw.closesAt.toISOString() : null,
    };

    return NextResponse.json(
      { ok: true, today: payload },
      { status: 200 },
    );
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
