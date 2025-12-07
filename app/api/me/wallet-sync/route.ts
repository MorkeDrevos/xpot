// app/api/me/wallet-sync/route.ts
import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { ok: false, error: 'WALLET_SYNC_DISABLED' },
    { status: 501 },
  );
}
