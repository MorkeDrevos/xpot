import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../_auth';

type DrawStatus = 'open' | 'closed';

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    // Today (UTC)
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const startOfDay = new Date(`${todayStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${todayStr}T23:59:59.999Z`);

    // ✅ Pick the LATEST draw today (in case multiple exist)
    const draw = await prisma.draw.findFirst({
      where: {
        drawDate: { gte: startOfDay, lt: endOfDay },
      },
      orderBy: {
        drawDate: 'desc',
      },
      include: {
        tickets: true,
      },
    });

    if (!draw) {
      return NextResponse.json({ ok: true, today: null });
    }

        // ✅ No closesAt column exists → calculate it
    const c = new Date(draw.drawDate);
    c.setUTCHours(21, 0, 0, 0); // 22:00 Madrid winter
    const closesAt = c.toISOString();

    // Map Prisma enum → our DrawStatus union
    const rawStatus = (draw as any).status as string | null;

    let status: DrawStatus;
    switch (rawStatus?.toLowerCase()) {
      case 'closed':
        status = 'closed';
        break;
      case 'completed':
        status = 'completed';
        break;
      default:
        status = 'open';
    }

    const today = {
      id: draw.id,
      date: draw.drawDate.toISOString(),
      status,
      jackpotUsd: draw.jackpotUsd ?? 0,
      rolloverUsd: 0, // safe placeholder for future schema
      ticketsCount: draw.tickets.length,
      closesAt,
    };

    return NextResponse.json({ ok: true, today });

  } catch (err) {
    console.error('[ADMIN] /today error', err);
    return NextResponse.json(
      { ok: false, error: 'FAILED_TO_LOAD_TODAY' },
      { status: 500 }
    );
  }
}
