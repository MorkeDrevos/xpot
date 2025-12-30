// app/api/ops/health/route.ts
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET() {
  return NextResponse.json(
    { ok: true, ops: true, mode: 'available' },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  );
}
