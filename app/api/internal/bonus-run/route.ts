// app/api/internal/bonus-run/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const INTERNAL_HEADER = 'x-xpot-internal-key';

function isAuthed(req: NextRequest) {
  const expected = process.env.XPOT_INTERNAL_CRON_KEY ?? '';
  const incoming = req.headers.get(INTERNAL_HEADER) ?? '';
  if (!expected) return false;
  return incoming === expected;
}

async function runBonusAndAutoDraw() {
  const now = new Date();

  // TODO: your existing logic here
  // - find due bonus drops (scheduledAt <= now, status SCHEDULED)
  // - pick winner from today's tickets
  // - create Winner row (kind BONUS, label, payoutUsd = amountXpot)
  // - mark BonusDrop as FIRED
  // - (optional) if auto mode: if draw.closesAt <= now and draw open => pick MAIN winner, close draw

  return { ok: true, now: now.toISOString() };
}

export async function GET(req: NextRequest) {
  if (!isAuthed(req)) {
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }
  const result = await runBonusAndAutoDraw();
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) {
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }
  const result = await runBonusAndAutoDraw();
  return NextResponse.json(result);
}
