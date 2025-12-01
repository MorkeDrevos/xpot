// app/api/admin/draw/recent-winners/route.ts
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

  // v1: no completed draws yet.
  // Later: return last N finished draws with winner + payout info.
  return NextResponse.json({
    ok: true,
    winners: [] as Array<{
      drawId: string;
      date: string;
      ticketCode: string;
      walletAddress: string;
      jackpotUsd: number;
      paidOut: boolean;
      txUrl?: string;
    }>,
  });
}
