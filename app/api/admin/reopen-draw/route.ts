// app/api/admin/reopen-draw/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/app/api/admin/_auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // Admin auth
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    // Today as YYYY-MM-DD
    const todayStr = new Date().toISOString().slice(0, 10);

    // Find today's draw
    const draw = await prisma.draw.findFirst({
      where: {
        drawDate: {
          gte: new Date(`${todayStr}T00:00:00.000Z`),
          lt: new Date(`${todayStr}T23:59:59.999Z`),
        },
      },
    });

    if (!draw) {
      return NextResponse.json(
        { ok: false, error: 'NO_TODAY_DRAW' },
        { status: 404 },
      );
    }

    // Re-open the draw: clear winner / settlement fields,
    // mark it as not closed (we rely on isClosed + resolvedAt in the UI).
    await prisma.draw.update({
      where: { id: draw.id },
      data: {
        // status: 'OPEN',   // ❌ REMOVE – Prisma types don’t have this yet
        isClosed: false,
        resolvedAt: null,
        paidAt: null,
        payoutTx: null,
        winnerTicketId: null,
      },
    });

    // Reset all tickets in this draw back to IN_DRAW
    await prisma.ticket.updateMany({
      where: { drawId: draw.id },
      data: {
        status: 'IN_DRAW',
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[XPOT] reopen-draw error', err);
    return NextResponse.json(
      { ok: false, error: 'REOPEN_DRAW_FAILED' },
      { status: 500 },
    );
  }
}
