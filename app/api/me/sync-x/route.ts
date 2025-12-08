// app/api/me/sync-x/route.ts
import { NextResponse } from 'next/server';

export async function POST() {
  // X login temporarily disabled – keep route but do nothing
  return NextResponse.json(
    { ok: false, error: 'X_LOGIN_DISABLED' },
    { status: 501 },
  );
}
