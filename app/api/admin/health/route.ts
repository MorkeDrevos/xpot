// app/api/admin/health/route.ts
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

const HEADER = 'x-xpot-admin-token';

export async function GET(req: Request) {
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

  return NextResponse.json({ ok: true, ts: new Date().toISOString() });
}
