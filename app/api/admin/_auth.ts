// app/api/admin/_auth.ts
import { NextResponse } from 'next/server';

export const ADMIN_HEADER = 'x-xpot-admin-key';

function isFrozen() {
  // only server reads this (do NOT make it NEXT_PUBLIC)
  return (process.env.XPOT_OPS_FROZEN ?? '').toLowerCase() === 'true';
}

export function requireAdmin(req: Request) {
  // ✅ Freeze gate (panic switch)
  if (isFrozen()) {
    return NextResponse.json(
      {
        ok: false,
        error: 'OPS_FROZEN',
        message:
          'Ops is currently frozen (XPOT_OPS_FROZEN=true). Disable the env var to re-enable admin actions.',
      },
      { status: 423 }, // Locked
    );
  }

  // ✅ Backwards compatible: new key preferred, legacy fallback
  const expected =
    (process.env.XPOT_OPS_ADMIN_KEY ?? '').trim() ||
    (process.env.XPOT_ADMIN_TOKEN ?? '').trim();

  const incoming = (req.headers.get(ADMIN_HEADER) ?? '').trim();

  if (!expected || incoming !== expected) {
    return NextResponse.json(
      {
        ok: false,
        error: 'UNAUTHED',
        message: 'Missing or invalid admin token.',
      },
      { status: 401 },
    );
  }

  return null;
}
