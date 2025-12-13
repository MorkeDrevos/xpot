// app/api/admin/_auth.ts
import { NextResponse } from 'next/server';

export const ADMIN_HEADER = 'x-xpot-admin-key';

export function requireAdmin(req: Request) {
  const expected = (process.env.XPOT_ADMIN_TOKEN ?? '').trim();
  const incoming = (req.headers.get(ADMIN_HEADER) ?? '').trim();

  if (!expected) {
    return NextResponse.json(
      { ok: false, error: 'ADMIN_TOKEN_NOT_CONFIGURED' },
      { status: 401 }
    );
  }

  if (!incoming || incoming !== expected) {
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  return null; // ✅ authed
}
