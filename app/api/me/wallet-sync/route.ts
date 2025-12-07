// app/api/me/wallet-sync/route.ts
import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      error: 'X_LOGIN_DISABLED',
      message: 'Wallet sync is disabled while we rework auth.',
    },
    { status: 501 }
  );
}
