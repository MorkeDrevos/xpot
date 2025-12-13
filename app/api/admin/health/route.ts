// app/api/admin/health/route.ts
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../_auth';

export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  return NextResponse.json({
    ok: true,
    admin: true,
    envActive: !!process.env.XPOT_ADMIN_TOKEN,
    now: new Date().toISOString(),
  });
}
