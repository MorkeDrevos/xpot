// app/api/me/sync-x/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { ok: false, error: 'X_LOGIN_DISABLED' },
    { status: 501 },
  );
}

export async function POST() {
  return NextResponse.json(
    { ok: false, error: 'X_LOGIN_DISABLED' },
    { status: 501 },
  );
}
