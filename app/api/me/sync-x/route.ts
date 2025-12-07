// app/api/me/sync-x/route.ts
import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      error: 'X_LOGIN_DISABLED',
      message: 'X handle sync is disabled while we rework auth.',
    },
    { status: 501 }
  );
}
