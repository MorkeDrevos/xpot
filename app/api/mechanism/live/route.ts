// app/api/mechanism/live/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// UTC day bucket helper (consistent + deterministic)
function utcDayStart(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
}

function normalizeDrawStatus(s: string | null | undefined) {
  const v = String(s || '').toLowerCase();
  if (v === 'open') return 'OPEN';
  if (v === 'drawing') return 'DRAWING';
  if (v === 'completed') return 'COMPLETED';
  if (v === 'closed') return 'LOCKED';
  return 'LOCKED';
}

export async function GET() {
  try {
    const today = utcDayStart(new Date());

    const draw = await prisma.draw.findUnique({
      where: { drawDate: today },
      select: {
        id: true,
        drawDate: true,
        closesAt: true,
        status: true,
        _count: { select: { tickets: true } },
      },
    });

    if (!draw) {
      return NextResponse.json(
        { ok: true, draw: null, engine: { status: 'IDLE' } },
        { headers: { 'Cache-Control': 'no-store, max-age=0' } },
      );
    }

    // last MAIN winner (if exists)
    const lastMain = await prisma.winner.findFirst({
      where: { drawId: draw.id, kind: 'MAIN' },
      orderBy: { date: 'desc' },
      select: {
        id: true,
        date: true,
        ticketCode: true,
        walletAddress: true,
        isPaidOut: true,
        txUrl: true,
      },
    });

    const statusNorm = normalizeDrawStatus(draw.status);

    const engineStatus =
      statusNorm === 'DRAWING'
        ? 'EXECUTING'
        : statusNorm === 'COMPLETED'
        ? 'COMPLETED'
        : statusNorm === 'OPEN'
        ? 'IDLE'
        : 'IDLE';

    // Mask wallet for public
    const mask = (a: string) =>
      a && a.length > 10 ? `${a.slice(0, 4)}...${a.slice(-4)}` : a;

    return NextResponse.json(
      {
        ok: true,
        draw: {
          id: draw.id,
          drawDate: draw.drawDate.toISOString(),
          closesAt: draw.closesAt ? draw.closesAt.toISOString() : null,
          status: statusNorm,
          ticketsCount: draw._count.tickets,
          jackpotXpot: 1_000_000,
        },
        engine: {
          status: engineStatus, // IDLE | EXECUTING | COMPLETED
          algorithm: 'Uniform random selection over eligible IN_DRAW tickets',
          randomness: 'Node crypto.randomInt (server-side)',
          notes: [
            'Eligible pool = tickets where status=IN_DRAW for the active draw',
            'Winner is selected uniformly at random from the pool',
            'Result is persisted to the Winners table and the winning ticket is marked WON',
          ],
        },
        lastMainWinner: lastMain
          ? {
              id: lastMain.id,
              date: lastMain.date.toISOString(),
              ticketCode: lastMain.ticketCode,
              walletAddress: mask(lastMain.walletAddress),
              isPaidOut: lastMain.isPaidOut,
              txUrl: lastMain.txUrl || null,
            }
          : null,
      },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } },
    );
  } catch (err: any) {
    console.error('[mechanism/live]', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'INTERNAL_ERROR' },
      { status: 500, headers: { 'Cache-Control': 'no-store, max-age=0' } },
    );
  }
}
