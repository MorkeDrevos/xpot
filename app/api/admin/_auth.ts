// app/api/admin/_auth.ts
import { NextRequest, NextResponse } from 'next/server';

const ADMIN_HEADER = 'x-admin-token';

export function requireAdmin(req: NextRequest) {
  const expected = process.env.XPOT_ADMIN_TOKEN;

  // Read header from the request
  const token =
    req.headers.get(ADMIN_HEADER) ??
    req.headers.get(ADMIN_HEADER.toLowerCase());

  if (!expected || !token || token !== expected) {
    return NextResponse.json(
      { ok: false, error: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  // null means "allowed"
  return null;
}
