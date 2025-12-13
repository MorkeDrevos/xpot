// app/api/admin/_auth.ts
import { NextResponse } from 'next/server';

const ADMIN_TOKEN = process.env.XPOT_ADMIN_TOKEN || '';

export const ADMIN_HEADER = 'x-xpot-admin-token';

export function requireAdmin(req: Request) {
  if (!ADMIN_TOKEN) {
    return NextResponse.json(
      { ok: false, error: 'ADMIN_TOKEN_NOT_CONFIGURED' },
      { status: 500 },
    );
  }

  // Primary: your custom header
  const incoming = (req.headers.get(ADMIN_HEADER) || '').trim();

  // Optional fallback: Authorization: Bearer <token>
  const auth = (req.headers.get('authorization') || '').trim();
  const bearer =
    auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : '';

  const token = incoming || bearer;

  if (!token || token !== ADMIN_TOKEN) {
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  return null; // ok
}
