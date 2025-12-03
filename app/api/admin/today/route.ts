// app/api/admin/today/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../_auth';

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    // Today as YYYY-MM-DD string
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    const startOfDay = new Date(`${todayStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${todayStr}T23:59:59.999Z`);

    const draw = await prisma.draw.findFirst({
      where: {
        drawDate: {
          gte: startOfDay,
          lt: endOfDay,
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

    // Close time: 22:00 Europe/Madrid (~ 21:00 UTC) on the draw's date
    const closesAt = new Date(draw.drawDate);
    closesAt.setUTCHours(21, 0, 0, 0); // 22:00 Madrid in winter (UTC+1)

    const today = {
      id: draw.id,
      date: draw.drawDate.toISOString(),
      status: draw.isClosed ? 'closed' : 'open', // later you can add 'completed'
      jackpotUsd: draw.jackpotUsd ?? 0,
      rolloverUsd: 0, // placeholder for future rollover field
      ticketsCount: draw.tickets.length,
      closesAt: closesAt.toISOString(),
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
