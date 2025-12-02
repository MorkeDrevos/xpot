import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../_auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type Body = {
  closesAt?: string;   // ISO string, e.g. "2025-12-02T22:00:00.000Z"
  jackpotUsd?: number; // optional override
};

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'INVALID_BODY' },
      { status: 400 }
    );
  }

  const now = new Date();

  // Start of "today" in UTC – this is the same anchor used by /api/draw/today
  const todayStartUtc = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );

  // If admin didn’t pass a closesAt, default to “24h from now”
  const closeTime = body.closesAt
    ? new Date(body.closesAt)
    : new Date(now.getTime() + 24 * 60 * 60 * 1000);

  if (isNaN(closeTime.getTime())) {
    return NextResponse.json(
      { ok: false, error: 'INVALID_CLOSE_TIME' },
      { status: 400 }
    );
  }

  const jackpotUsd = body.jackpotUsd ?? 0;

  try {
    const draw = await prisma.draw.upsert({
      where: { drawDate: todayStartUtc },
      create: {
        id: `manual-${todayStartUtc.toISOString()}`,
        drawDate: todayStartUtc,
        isClosed: false,
        jackpotUsd,
        closesAt: closeTime,
      },
      update: {
        isClosed: false,
        resolvedAt: null,
        jackpotUsd,
        closesAt: closeTime,
        paidAt: null,
        payoutTx: null,
        winnerTicketId: null,
      },
    });

    return NextResponse.json({ ok: true, draw });
  } catch (err) {
    console.error('[ADMIN] /api/admin/draw/start error', err);
    return NextResponse.json(
      { ok: false, error: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
