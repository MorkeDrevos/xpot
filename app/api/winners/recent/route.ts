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

function pickAmountXpot(w: any): number | null {
  const candidates = [
    w?.amountXpot,
    w?.payoutXpot,
    w?.amount,
    w?.payoutAmount,
  ];
  for (const c of candidates) {
    if (typeof c === 'number' && Number.isFinite(c)) return c;
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const limit = intParam(req.nextUrl.searchParams.get('limit'), 50);
    const take = Math.min(limit * 10, 5000);

    // Debug: DB fingerprint (kills env confusion forever)
    let dbInfo: { db: string; host: string | null; port: number | null } | null = null;
    try {
      const rows = await prisma.$queryRaw<
        Array<{ db: string; host: string | null; port: number | null }>
      >`SELECT current_database()::text AS db, inet_server_addr()::text AS host, inet_server_port()::int AS port`;
      dbInfo = rows?.[0] ?? null;
    } catch {
      dbInfo = null;
    }

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
        orderBy: [{ date: 'desc' }],
        include,
      });
    } catch {
      try {
        rows = await (prisma.winner as any).findMany({
          take,
          orderBy: [{ createdAt: 'desc' }],
          include,
        });
      } catch {
        rows = await (prisma.winner as any).findMany({
          take,
          include,
        });
      }
    }

    // Dedupe: ONE drawId = ONE winner (fallbacks if drawId missing)
    const seen = new Set<string>();
    const uniq: any[] = [];
    for (const w of rows) {
      const key =
        String((w as any).drawId ?? '') ||
        String((w as any).draw?.id ?? '') ||
        // last resort: bucket by drawDate (date-only) to avoid double winners on same day
        String(((w as any).draw?.drawDate ?? (w as any).date ?? (w as any).createdAt)?.toString?.() ?? w.id) ||
        String(w.id);

      if (seen.has(key)) continue;
      seen.add(key);
      uniq.push(w);
      if (uniq.length >= limit) break;
    }

    // Fallback lookup for missing user/avatar:
    // If a Winner has walletAddress but ticket->wallet->user is missing, resolve via Wallet.address.
    const missingWalletAddrs = Array.from(
      new Set(
        uniq
          .map(w => (w as any).walletAddress as string | null)
          .filter(Boolean)
          .filter(addr => {
            const ticket = (w as any).ticket;
            const wallet = ticket?.wallet;
            const user = wallet?.user;
            return !user; // missing linkage
          }) as string[],
      ),
    );

    const walletToUser = new Map<
      string,
      { xHandle: string | null; xName: string | null; xAvatarUrl: string | null }
    >();

    if (missingWalletAddrs.length) {
      const wallets = await prisma.wallet.findMany({
        where: { address: { in: missingWalletAddrs } },
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
      const draw = (w as any).draw;
      const ticket = (w as any).ticket;

      const ticketWallet = ticket?.wallet;
      const ticketUser = ticketWallet?.user;

      const winnerWalletAddress =
        (w as any).walletAddress ??
        ticket?.walletAddress ??
        ticketWallet?.address ??
        null;

      // Prefer the ticket->wallet->user chain, else fallback map via Winner.walletAddress
      const fallbackUser = winnerWalletAddress ? walletToUser.get(winnerWalletAddress) : null;

      const handle = ticketUser?.xHandle ?? fallbackUser?.xHandle ?? null;
      const name = (ticketUser as any)?.xName ?? fallbackUser?.xName ?? null;
      const avatarUrl = (ticketUser as any)?.xAvatarUrl ?? fallbackUser?.xAvatarUrl ?? null;

      return {
        id: w.id,
        drawId: (w as any).drawId ?? draw?.id ?? null,

        kind: (w as any).kind ?? 'MAIN',
        label: (w as any).label ?? null,

        // prefer draw.drawDate, fallback to winner.date/createdAt
        drawDate: safeIso(draw?.drawDate ?? (w as any).date ?? (w as any).createdAt),

        ticketCode: (w as any).ticketCode ?? ticket?.code ?? null,

        amountXpot: pickAmountXpot(w),

        // IMPORTANT: use Winner.walletAddress if present (it may exist even when relations are broken)
        walletAddress: winnerWalletAddress,

        handle,
        name,
        avatarUrl,

        isPaidOut: typeof (w as any).isPaidOut === 'boolean' ? (w as any).isPaidOut : null,
        txUrl: (w as any).txUrl ?? null,
        txSig: (w as any).txSig ?? null,
      };
    });

    const meta = {
      db: dbInfo, // { db, host, port } when available
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
