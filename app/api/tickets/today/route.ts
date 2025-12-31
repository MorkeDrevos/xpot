// app/api/tickets/today/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type UiStatus = 'in-draw' | 'expired' | 'not-picked' | 'won' | 'claimed';

function toUiStatus(raw: any): UiStatus {
  const s = String(raw ?? '').trim();

  if (s === 'in-draw' || s === 'expired' || s === 'not-picked' || s === 'won' || s === 'claimed') return s;

  const up = s.toUpperCase();

  if (up === 'IN_DRAW' || up === 'IN-DRAW') return 'in-draw';
  if (up === 'NOT_PICKED' || up === 'NOT-PICKED') return 'not-picked';
  if (up === 'WON') return 'won';
  if (up === 'CLAIMED') return 'claimed';
  if (up === 'EXPIRED') return 'expired';

  return 'in-draw';
}

// If you want a number here for UI, keep it as a constant.
// (Or delete jackpotUsd entirely from the response if you’re not using it.)
const DEFAULT_JACKPOT_USD = 10_000;

export async function GET() {
  try {
    // Today in UTC
    const now = new Date();
    const yyyy = now.getUTCFullYear();
    const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(now.getUTCDate()).padStart(2, '0');

    const start = new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`);
    const end = new Date(`${yyyy}-${mm}-${dd}T23:59:59.999Z`);

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

    if (!drawRecord) {
      return NextResponse.json({
        ok: true,
        draw: null,
        tickets: [],
      });
    }

    const tickets = (drawRecord.tickets ?? []).map((t: any) => ({
      id: t.id,
      code: t.code,
      status: toUiStatus(t.status),
      label: t.label ?? 'Ticket for today’s draw',
      jackpotUsd: DEFAULT_JACKPOT_USD,
      createdAt: t.createdAt,
      walletAddress: String(t.walletAddress ?? t.wallet_address ?? t.wallet?.address ?? ''),
    }));

    return NextResponse.json({
      ok: true,
      draw: {
        id: drawRecord.id,
        drawDate: drawRecord.drawDate,
        status: String(drawRecord.status ?? 'open'),
        jackpotUsd: DEFAULT_JACKPOT_USD,
        rolloverUsd: 0,
      },
      tickets,
    });
  } catch (err) {
    console.error('GET /api/tickets/today error', err);
    return NextResponse.json({ ok: false, error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
