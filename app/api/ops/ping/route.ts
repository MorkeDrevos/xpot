// app/api/ops/ping/route.ts
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET() {
  return NextResponse.json(
    { ok: true, pong: true },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  );
}
