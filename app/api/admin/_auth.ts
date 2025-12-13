// app/api/admin/_auth.ts
import { NextRequest, NextResponse } from 'next/server';

export const ADMIN_HEADER = 'x-xpot-admin-key';

function nowIso() {
  return new Date().toISOString();
}

export function isAdminAuthed(req: NextRequest) {
  const expected = process.env.XPOT_OPS_ADMIN_KEY ?? '';
  const incoming = req.headers.get(ADMIN_HEADER) ?? '';
  if (!expected) return false; // locked if env not set
  return incoming === expected;
}

/**
 * Returns a NextResponse(401) if NOT authed, otherwise returns null.
 * Use in routes like:
 *   const denied = requireAdmin(req); if (denied) return denied;
 */
export function requireAdmin(req: NextRequest): NextResponse | null {
  if (isAdminAuthed(req)) return null;

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

// Some newer routes may import this name - keep both for compatibility.
export const requireAdminAuth = requireAdmin;
