// app/api/ops/health/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/app/api/admin/_auth';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  return NextResponse.json(
    {
      ok: true,
      ops: true,
      mode: 'available',
    },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  );
}
