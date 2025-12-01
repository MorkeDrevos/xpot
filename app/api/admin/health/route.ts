// app/api/admin/health/route.ts
import { NextRequest, NextResponse } from 'next/server';

function isAuthorized(req: NextRequest) {
  const header =
    req.headers.get('x-admin-token') ||
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  if (!header || header !== process.env.XPOT_ADMIN_TOKEN) {
    return false;
  }

  return true;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { ok: false, error: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    ok: true,
    admin: true,
    envActive: !!process.env.XPOT_ADMIN_TOKEN,
    now: new Date().toISOString(),
  });
}
