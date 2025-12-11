// app/api/admin/bonus-jackpot/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../_auth';

// Legacy manual “bonus jackpot” endpoint.
// Now that we have the BonusDrop system, this can stay as a simple
// helper that just inspects today’s draw + tickets and returns a summary.
// It MUST include `tickets` in the query so TypeScript is happy.

export async function POST(req: NextRequest) {
  // Admin guard (throws 401/403 if invalid)
  await requireAdmin(req);

  // Today in UTC (same pattern we used elsewhere)
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10); // "YYYY-MM-DD"

  const startOfDay = new Date(`${todayStr}T00:00:00.000Z`);
  const endOfDay = new Date(`${todayStr}T23:59:59.999Z`);

  // Find today's draw and INCLUDE tickets so `draw.tickets` exists
  const draw = await prisma.draw.findFirst({
    where: {
      date: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
    include: {
      tickets: true,
    },
  });

  if (!draw) {
    return NextResponse.json(
      { ok: false, error: 'NO_DRAW_TODAY' },
      { status: 400 },
    );
  }

  if (!draw.tickets.length) {
    return NextResponse.json(
      { ok: false, error: 'NO_TICKETS_TODAY' },
      { status: 400 },
    );
  }

  // For now we just return a summary. The real bonus winner
  // selection now lives in the new bonus-drop flow.
  return NextResponse.json({
    ok: true,
    drawId: draw.id,
    date: draw.date.toISOString(),
    status: draw.status,
    ticketsCount: draw.tickets.length,
  });
}
