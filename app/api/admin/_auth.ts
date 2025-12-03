// app/api/admin/_auth.ts
import { NextRequest, NextResponse } from 'next/server';

const ADMIN_TOKEN = process.env.XPOT_ADMIN_TOKEN;

/**
 * Shared admin guard.
 * - Returns NextResponse (error) if not allowed
 * - Returns null if request is authorised
 */
export function requireAdmin(req: NextRequest) {
  if (!ADMIN_TOKEN) {
    return NextResponse.json(
      { ok: false, error: 'ADMIN_TOKEN_NOT_CONFIGURED' },
      { status: 500 },
    );
  }

  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;

  if (!token || token !== ADMIN_TOKEN) {
    return NextResponse.json(
      { ok: false, error: 'UNAUTHORIZED' },
      { status: 401 },
    );
  }

  // null = allowed
  return null;
}
