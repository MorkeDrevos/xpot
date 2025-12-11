// app/api/admin/draw/today/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../../_auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    // 1) Calculate today's range (UTC)
    const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const start = new Date(`${todayStr}T00:00:00.000Z`);
    const end = new Date(`${todayStr}T23:59:59.999Z`);

    // 2) Load today's draw
    const draw = await prisma.draw.findFirst({
      where: {
        drawDate: { gte: start, lt: end },
      },
      include: {
        tickets: true,
        winners: {
          include: {
            ticket: {
              include: { wallet: true },
            },
          },
        },
      },
    });

    if (!draw) {
      return NextResponse.json(
        { ok: false, error: 'NO_DRAW_TODAY' },
        { status: 200 },
      );
    }

    // 3) Determine status (based purely on `status` field)
    const status = draw.status; // "open" | "closed" | "completed"

    // 4) Build response
    const payload = {
      id: draw.id,
      drawDate: draw.drawDate.toISOString(),
      status,
      ticketsCount: draw.tickets.length,
      winners: draw.winners.map((w) => ({
        id: w.id,
        kind: w.kind,
        ticketId: w.ticketId,
        wallet: w.ticket?.wallet?.address ?? '',
      })),
    };

    return NextResponse.json({ ok: true, today: payload }, { status: 200 });
  } catch (err: any) {
    console.error('[/admin/draw/today] error:', err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
