// app/api/admin/draw/reopen/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../../_auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    // 1) Get the latest draw by drawDate
    const draw = await prisma.draw.findFirst({
      orderBy: { drawDate: 'desc' },
    });

    if (!draw) {
      return NextResponse.json(
        { ok: false, error: 'NO_DRAW_FOUND' },
        { status: 400 },
      );
    }

    // 2) Reopen logic:
    // - Delete MAIN winners for this draw
    // - Reset tickets for this draw back to IN_DRAW
    // - Set draw status back to "open"
    const updatedDraw = await prisma.$transaction(async (tx) => {
      // Remove MAIN winners for this draw
      await tx.winner.deleteMany({
        where: {
          drawId: draw.id,
          kind: 'MAIN',
        },
      });

      // Reset all tickets on this draw back to IN_DRAW
      await tx.ticket.updateMany({
        where: {
          drawId: draw.id,
        },
        data: {
          status: 'IN_DRAW',
        },
      });

      // Reopen the draw
      return tx.draw.update({
        where: { id: draw.id },
        data: {
          status: 'open',
        },
      });
    });

    return NextResponse.json(
      {
        ok: true,
        drawId: updatedDraw.id,
        status: updatedDraw.status,
        drawDate: updatedDraw.drawDate.toISOString(),
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error('[XPOT] /admin/draw/reopen error:', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
