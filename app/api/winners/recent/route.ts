// app/api/winners/recent/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function intParam(v: string | null, fallback: number) {
  const n = v ? Number(v) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.min(5000, Math.floor(n)));
}

function safeIso(d: any) {
  try {
    if (!d) return null;
    const dt = d instanceof Date ? d : new Date(d);
    if (Number.isNaN(dt.getTime())) return null;
    return dt.toISOString();
  } catch {
    return null;
  }
}

function pickAmountXpot(w: any): number | null {
  const candidates = [
    w?.amountXpot,
    w?.payoutXpot,
    w?.amount,
    w?.payoutAmount,
    w?.payoutUsd, // if you were (temporarily) storing XPOT amount here
  ];
  for (const c of candidates) {
    if (typeof c === 'number' && Number.isFinite(c)) return c;
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const limit = intParam(req.nextUrl.searchParams.get('limit'), 50);

    // 1) Confirm DB has winners at all (this instantly tells us if you're on the wrong DB/env)
    const total = await prisma.winner.count();

    // 2) Fetch winners (no distinct, no draw.status filter). We overfetch so we can dedupe.
    // We try multiple orderings because your schema might not have date/createdAt.
    let rows: any[] = [];
    const take = Math.min(limit * 10, 5000);

    const include = {
      draw: true,
      ticket: {
        include: {
          wallet: {
            include: {
              user: true,
            },
          },
        },
      },
    } as const;

    // Try winner.date
    try {
      rows = await (prisma.winner as any).findMany({
        take,
        orderBy: { date: 'desc' },
        include,
      });
    } catch {
      // Try winner.createdAt
      try {
        rows = await (prisma.winner as any).findMany({
          take,
          orderBy: { createdAt: 'desc' },
          include,
        });
      } catch {
        // Last resort: no orderBy (still returns data)
        rows = await (prisma.winner as any).findMany({
          take,
          include,
        });
      }
    }

    // 3) Deduplicate: ONE DRAW = ONE PUBLIC WINNER
    // Prefer drawId if present, else fallback to included draw.id, else winner.id (so nothing disappears)
    const seen = new Set<string>();
    const uniq: any[] = [];
    for (const w of rows) {
      const key =
        String((w as any).drawId ?? '') ||
        String((w as any).draw?.id ?? '') ||
        String(w.id);

      if (seen.has(key)) continue;
      seen.add(key);
      uniq.push(w);
      if (uniq.length >= limit) break;
    }

    const payload = uniq.map(w => {
      const draw = (w as any).draw;
      const ticket = (w as any).ticket;
      const wallet = ticket?.wallet;
      const user = wallet?.user;

      return {
        id: w.id,
        drawId: (w as any).drawId ?? draw?.id ?? null,

        kind: (w as any).kind ?? 'MAIN',
        label: (w as any).label ?? null,

        // prefer draw.drawDate, fallback to winner.date/createdAt
        drawDate: safeIso(draw?.drawDate ?? (w as any).date ?? (w as any).createdAt),

        ticketCode: (w as any).ticketCode ?? ticket?.code ?? null,

        amountXpot: pickAmountXpot(w),

        walletAddress: wallet?.address ?? null,

        handle: user?.xHandle ?? null,
        name: (user as any)?.xName ?? null,
        avatarUrl: (user as any)?.xAvatarUrl ?? null,

        isPaidOut: typeof (w as any).isPaidOut === 'boolean' ? (w as any).isPaidOut : null,
        txUrl: (w as any).txUrl ?? null,
        txSig: (w as any).txSig ?? null,
      };
    });

    // 4) Debug meta to end this guessing forever
    const meta = {
      totalWinnersInDb: total,
      fetchedRows: rows.length,
      returned: payload.length,
      sample: payload[0] ?? null,
    };

    return NextResponse.json({ ok: true, winners: payload, meta }, { status: 200 });
  } catch (err: any) {
    console.error('GET /api/winners/recent error', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
