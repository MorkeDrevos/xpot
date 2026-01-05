// app/api/winners/recent/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function intParam(v: string | null, fallback: number) {
  const n = v ? Number(v) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.min(5000, Math.floor(n)));
}

function safeIso(d: unknown) {
  try {
    if (!d) return null;
    const dt = d instanceof Date ? d : new Date(d as any);
    if (Number.isNaN(dt.getTime())) return null;
    return dt.toISOString();
  } catch {
    return null;
  }
}

function toNumberOrNull(v: any): number | null {
  try {
    if (v === null || v === undefined) return null;

    if (typeof v === 'number') return Number.isFinite(v) ? v : null;

    if (typeof v === 'string') {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    }

    if (typeof v === 'bigint') {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    }

    if (typeof v === 'object') {
      if (typeof v.toNumber === 'function') {
        const n = v.toNumber();
        return typeof n === 'number' && Number.isFinite(n) ? n : null;
      }
      if (typeof v.toString === 'function') {
        const n = Number(v.toString());
        return Number.isFinite(n) ? n : null;
      }
    }

    return null;
  } catch {
    return null;
  }
}

function pickAmountXpot(w: any): number | null {
  const candidates = [
    // Winner row fields
    w?.amountXpot,
    w?.payoutXpot,
    w?.amount,
    w?.payoutAmount,

    // Draw row fields (common in many schemas)
    w?.draw?.amountXpot,
    w?.draw?.payoutXpot,
    w?.draw?.amount,
    w?.draw?.payoutAmount,
    w?.draw?.poolXpot,
    w?.draw?.poolAmountXpot,
    w?.draw?.rewardXpot,
  ];

  for (const c of candidates) {
    const n = toNumberOrNull(c);
    if (n !== null) return n;
  }

  return null;
}

export async function GET(req: NextRequest) {
  try {
    const limit = intParam(req.nextUrl.searchParams.get('limit'), 50);
    const take = Math.min(limit * 10, 5000);

    const total = await prisma.winner.count();

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

    // Fetch winners with best-effort ordering
    let rows: any[] = [];
    try {
      rows = await (prisma.winner as any).findMany({
        take,
        orderBy: { date: 'desc' },
        include,
      });
    } catch {
      try {
        rows = await (prisma.winner as any).findMany({
          take,
          orderBy: { createdAt: 'desc' },
          include,
        });
      } catch {
        rows = await (prisma.winner as any).findMany({
          take,
          include,
        });
      }
    }

    // Deduplicate: ONE drawId = ONE public winner
    const seen = new Set<string>();
    const uniq: any[] = [];

    for (const w of rows) {
      const key = String(w.drawId ?? '') || String(w.draw?.id ?? '') || String(w.id);
      if (seen.has(key)) continue;
      seen.add(key);
      uniq.push(w);
      if (uniq.length >= limit) break;
    }

    // Resolve fallback users by wallet address (SAFE, no scope bugs)
    const walletAddrsNeedingLookup = uniq
      .filter(w => !w.ticket?.wallet?.user)
      .map(w => w.walletAddress ?? w.ticket?.walletAddress ?? w.ticket?.wallet?.address)
      .filter(Boolean) as string[];

    const walletToUser = new Map<string, { xHandle: string | null; xName: string | null; xAvatarUrl: string | null }>();

    if (walletAddrsNeedingLookup.length) {
      const wallets = await prisma.wallet.findMany({
        where: { address: { in: walletAddrsNeedingLookup } },
        include: { user: true },
      });

      for (const wa of wallets) {
        walletToUser.set(wa.address, {
          xHandle: wa.user?.xHandle ?? null,
          xName: (wa.user as any)?.xName ?? null,
          xAvatarUrl: (wa.user as any)?.xAvatarUrl ?? null,
        });
      }
    }

    const payload = uniq.map(w => {
      const draw = w.draw;
      const ticket = w.ticket;
      const wallet = ticket?.wallet;
      const user = wallet?.user;

      const walletAddress = w.walletAddress ?? ticket?.walletAddress ?? wallet?.address ?? null;
      const fallbackUser = walletAddress ? walletToUser.get(walletAddress) : null;

      return {
        id: w.id,
        drawId: w.drawId ?? draw?.id ?? null,

        kind: w.kind ?? 'MAIN',
        label: w.label ?? null,

        drawDate: safeIso(draw?.drawDate ?? w.date ?? w.createdAt),

        ticketCode: w.ticketCode ?? ticket?.code ?? null,

        // FIX: pick from winner OR draw and normalize to real number
        amountXpot: pickAmountXpot(w),

        walletAddress,

        handle: user?.xHandle ?? fallbackUser?.xHandle ?? null,
        name: (user as any)?.xName ?? fallbackUser?.xName ?? null,
        avatarUrl: (user as any)?.xAvatarUrl ?? fallbackUser?.xAvatarUrl ?? null,

        isPaidOut: typeof w.isPaidOut === 'boolean' ? w.isPaidOut : null,
        txUrl: w.txUrl ?? null,
        txSig: w.txSig ?? null,
      };
    });

    return NextResponse.json(
      {
        ok: true,
        winners: payload,
        meta: {
          totalWinnersInDb: total,
          fetchedRows: rows.length,
          returned: payload.length,
        },
        winnersPageUrl: '/winners',
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error('GET /api/winners/recent error', err);
    return NextResponse.json({ ok: false, error: err?.message || 'INTERNAL_ERROR' }, { status: 500 });
  }
}
