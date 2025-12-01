// app/api/admin/test/route.ts
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const adminToken = process.env.XPOT_ADMIN_TOKEN;
  const headerToken =
    req.headers.get('x-admin-token') ||
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  // Basic safety: if env is missing, block everything
  if (!adminToken) {
    return NextResponse.json(
      { ok: false, error: 'ADMIN_TOKEN_NOT_CONFIGURED' },
      { status: 500 }
    );
  }

  if (!headerToken || headerToken !== adminToken) {
    return NextResponse.json(
      { ok: false, error: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  // If token matches, return a simple OK payload
  return NextResponse.json({
    ok: true,
    message: 'Admin token accepted.',
    envActive: true,
  });
}
