// app/api/admin/_auth.ts
import { NextRequest, NextResponse } from 'next/server';

export const ADMIN_HEADER = 'x-xpot-admin-key';

export function nowIso() {
  return new Date().toISOString();
}

export function isAdminAuthed(req: NextRequest) {
  const expected = process.env.XPOT_OPS_ADMIN_KEY ?? '';
  const incoming = req.headers.get(ADMIN_HEADER) ?? '';
  if (!expected) return false; // locked if env not set
  return incoming === expected;
}

// For route handlers (GET/POST). Returns a NextResponse if blocked, else null.
export function requireAdminAuth(req: NextRequest) {
  const ok = isAdminAuthed(req);
  if (ok) return null;

  return NextResponse.json(
    {
      ok: false,
      error: 'Unauthorized',
      hint: `Set XPOT_OPS_ADMIN_KEY and send header ${ADMIN_HEADER}`,
      ts: nowIso(),
    },
    { status: 401 }
  );
}
