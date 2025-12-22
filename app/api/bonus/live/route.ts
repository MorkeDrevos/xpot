// app/api/bonus/live/route.ts
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type BonusOut = {
  id: string;
  amountXpot: number;
  scheduledAt: string; // ISO
  status: 'UPCOMING' | 'CLAIMED';
};

function num(v: any): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function iso(v: any): string {
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? new Date(0).toISOString() : d.toISOString();
}

function statusFromRow(row: any, nowMs: number): 'UPCOMING' | 'CLAIMED' {
  const s = String(row?.status || '').toUpperCase();
  if (s === 'UPCOMING' || s === 'CLAIMED') return s;

  // fallback inference
  const claimedAt = row?.claimedAt ? new Date(row.claimedAt).getTime() : NaN;
  if (Number.isFinite(claimedAt)) return 'CLAIMED';

  const at = row?.scheduledAt ? new Date(row.scheduledAt).getTime() : NaN;
  if (Number.isFinite(at) && at > nowMs) return 'UPCOMING';

  return 'CLAIMED';
}

export async function GET(req: Request) {
  const url = new URL(req.url);

  // Optional explicit mock mode for UI testing only:
  // /api/bonus/live?mock=1
  if (url.searchParams.get('mock') === '1') {
    const now = Date.now();
    return NextResponse.json({
      bonus: [
        {
          id: 'b1',
          amountXpot: 50_000,
          scheduledAt: new Date(now + 1000 * 60 * 25).toISOString(),
          status: 'UPCOMING',
        },
        {
          id: 'b2',
          amountXpot: 25_000,
          scheduledAt: new Date(now - 1000 * 60 * 40).toISOString(),
          status: 'CLAIMED',
        },
      ] satisfies BonusOut[],
      source: 'mock',
      updatedAt: new Date().toISOString(),
    });
  }

  // Real mode (DB-backed)
  try {
    // Import prisma in a way that won’t hard-crash builds if your prisma export shape differs.
    const mod: any = await import('@/lib/prisma').catch(() => null);
    const prisma: any = mod?.prisma ?? mod?.default ?? mod;

    if (!prisma) {
      return NextResponse.json({
        bonus: [] as BonusOut[],
        source: 'none',
        updatedAt: new Date().toISOString(),
      });
    }

    const now = new Date();
    const nowMs = now.getTime();

    // Window: last 12h + next 36h (keeps “claimed earlier today” visible + upcoming)
    const from = new Date(nowMs - 12 * 60 * 60 * 1000);
    const to = new Date(nowMs + 36 * 60 * 60 * 1000);

    // Try common model names without assuming your schema
    const model =
      (prisma as any).bonusDrop ??
      (prisma as any).bonusXPOT ??
      (prisma as any).bonus ??
      null;

    if (!model?.findMany) {
      return NextResponse.json({
        bonus: [] as BonusOut[],
        source: 'db-missing-model',
        updatedAt: now.toISOString(),
      });
    }

    const rows = await model.findMany({
      where: {
        scheduledAt: { gte: from, lte: to },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 50,
    });

    const bonus: BonusOut[] = (Array.isArray(rows) ? rows : []).map((r: any) => ({
      id: String(r.id ?? r.publicId ?? r.uuid ?? ''),
      amountXpot: num(r.amountXpot ?? r.amount ?? r.xpotAmount ?? r.valueXpot),
      scheduledAt: iso(r.scheduledAt ?? r.when ?? r.at),
      status: statusFromRow(r, nowMs),
    })).filter(b => b.id && b.scheduledAt);

    return NextResponse.json({
      bonus,
      source: 'db',
      updatedAt: now.toISOString(),
    });
  } catch {
    return NextResponse.json(
      {
        bonus: [] as BonusOut[],
        source: 'error',
        updatedAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  }
}
