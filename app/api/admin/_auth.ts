// app/api/admin/_auth.ts
import { NextResponse } from 'next/server';

export const ADMIN_HEADER = 'x-xpot-admin-token';

function isFrozen() {
  return (process.env.XPOT_OPS_FROZEN ?? '').toLowerCase() === 'true';
}

function getExpectedToken() {
  // Backwards compatible: prefer new key, fallback to old
  return (
    (process.env.XPOT_OPS_ADMIN_KEY ?? '').trim() ||
    (process.env.XPOT_ADMIN_TOKEN ?? '').trim()
  );
}

export function requireAdmin(req: Request) {
  // Freeze gate (panic switch)
  if (isFrozen()) {
    return NextResponse.json(
      {
        ok: false,
        error: 'OPS_FROZEN',
        message:
          'Ops is currently frozen (XPOT_OPS_FROZEN=true). Disable the env var to re-enable admin actions.',
      },
      { status: 423 },
    );
  }

  const expected = getExpectedToken();

  if (!expected) {
    return NextResponse.json(
      {
        ok: false,
        error: 'ADMIN_TOKEN_NOT_CONFIGURED',
        message:
          'No admin token configured. Set XPOT_OPS_ADMIN_KEY (preferred) or XPOT_ADMIN_TOKEN (legacy).',
      },
      { status: 500 },
    );
  }

  // Primary: custom header
  const incoming = (req.headers.get(ADMIN_HEADER) || '').trim();

  // Optional fallback: Authorization: Bearer <token>
  const auth = (req.headers.get('authorization') || '').trim();
  const bearer =
    auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : '';

  const token = incoming || bearer;

  if (!token || token !== expected) {
    return NextResponse.json(
      { ok: false, error: 'UNAUTHORIZED', message: 'Missing or invalid admin token.' },
      { status: 401 },
    );
  }

  return null;
}
