// app/api/admin/today/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../_auth';

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    // Today as YYYY-MM-DD string
    const todayStr = new Date().toISOString().slice(0, 10);

    const draw = await prisma.draw.findFirst({
      where: {
        drawDate: {
          gte: new Date(`${todayStr}T00:00:00.000Z`),
          lt:  new Date(`${todayStr}T23:59:59.999Z`),
        },
      },
      include: {
        tickets: true,
      },
    });

    if (!draw) {
      return NextResponse.json({
        ok: true,
        today: null,
      });
    }

    const today = {
      id: draw.id,
      date: draw.drawDate.toISOString(),
      status: draw.isClosed ? 'closed' : 'open', // you could add 'completed' later
      jackpotUsd: draw.jackpotUsd ?? 0,
      rolloverUsd: 0, // placeholder, if you later add a rollover field
      ticketsCount: draw.tickets.length,
      closesAt: null,
    };

    return NextResponse.json({
      ok: true,
      today,
    });
  } catch (err) {
    console.error('[ADMIN] /today error', err);
    return NextResponse.json(
      { ok: false, error: 'FAILED_TO_LOAD_TODAY' },
      { status: 500 },
    );
  }
}
