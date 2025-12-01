// app/api/admin/draw/today/route.ts
import { NextRequest, NextResponse } from 'next/server';

function isAuthorized(req: NextRequest) {
  const header =
    req.headers.get('x-admin-token') ||
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  if (!header || header !== process.env.XPOT_ADMIN_TOKEN) {
    return false;
  }

  return true;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { ok: false, error: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  // For v1 this is a static snapshot.
  // Later you’ll replace this with real DB data.
  const today = new Date();

  return NextResponse.json({
    ok: true,
    draw: {
      id: today.toISOString().slice(0, 10), // e.g. "2025-12-01"
      date: today.toISOString(),
      status: 'open',            // "open" | "closed" | "completed"
      jackpotUsd: 10_000,       // current jackpot pool
      rolloverUsd: 0,           // amount carried over from previous draw
      ticketsCount: 0,          // how many tickets so far
    },
  });
}
