// app/api/admin/health/route.ts
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { requireAdmin } from '../_auth';

export async function GET(req: Request) {
  const denied = requireAdmin(req as any);
  if (denied) return denied;

  return NextResponse.json({
    ok: true,
    envActive: !!process.env.XPOT_ADMIN_TOKEN,
    ts: new Date().toISOString(),
  });
}
