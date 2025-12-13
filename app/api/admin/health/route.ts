// app/api/admin/health/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { requireAdmin, ADMIN_HEADER } from '../_auth';

export async function GET(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  return NextResponse.json({
    ok: true,
    envActive: !!process.env.XPOT_ADMIN_TOKEN,
    expectedHeader: ADMIN_HEADER,
  });
}
