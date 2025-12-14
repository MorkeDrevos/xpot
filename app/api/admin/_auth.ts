// app/api/admin/_auth.ts
import { NextResponse } from 'next/server';

const ADMIN_HEADER = 'x-xpot-admin-token';

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

  const expected = process.env.XPOT_OPS_ADMIN_KEY ?? '';
  const incoming = req.headers.get(ADMIN_HEADER) ?? '';

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
