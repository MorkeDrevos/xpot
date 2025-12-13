// app/api/admin/_auth.ts
import { NextResponse } from 'next/server';

const HEADER = 'x-xpot-admin-token';

export function requireAdmin(req: Request) {
  const expectedRaw = process.env.XPOT_ADMIN_TOKEN ?? '';
  const expected = expectedRaw.trim();

  if (!expected) {
    return NextResponse.json(
      { ok: false, error: 'ADMIN_TOKEN_NOT_CONFIGURED' },
      { status: 500 },
    );
  }

  const incoming = (req.headers.get(HEADER) ?? '').trim();

  if (!incoming || incoming !== expected) {
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  return null;
}
