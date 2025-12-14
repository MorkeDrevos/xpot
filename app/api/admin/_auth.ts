// app/api/admin/_auth.ts
import { NextResponse } from 'next/server';

/**
 * Single source of truth for admin auth header.
 * Client must send this header on every /api/admin/* call.
 */
export const ADMIN_HEADER = 'x-xpot-admin-key';

/**
 * Admin auth gate for all admin API routes.
 *
 * Wiring contract (canonical):
 * - Header:  x-xpot-admin-key: <token>
 * - Env:     XPOT_OPS_ADMIN_KEY (preferred)
 * - Fallback env (legacy): XPOT_ADMIN_TOKEN
 *
 * Returns a NextResponse on failure, or null when authorized.
 */
export function requireAdmin(req: Request) {
  // Prefer the new env var, but keep legacy fallback so ops never bricks
  const expected =
    (process.env.XPOT_OPS_ADMIN_KEY ?? '').trim() ||
    (process.env.XPOT_ADMIN_TOKEN ?? '').trim();

  if (!expected) {
    return NextResponse.json(
      {
        ok: false,
        error: 'ADMIN_TOKEN_NOT_CONFIGURED',
        message:
          'Admin token is not configured. Set XPOT_OPS_ADMIN_KEY (preferred) or XPOT_ADMIN_TOKEN (legacy).',
      },
      { status: 500 },
    );
  }

  // Primary: custom header
  const incoming = (req.headers.get(ADMIN_HEADER) ?? '').trim();

  // Optional fallback: Authorization: Bearer <token>
  const auth = (req.headers.get('authorization') ?? '').trim();
  const bearer = auth.toLowerCase().startsWith('bearer ')
    ? auth.slice(7).trim()
    : '';

  const token = incoming || bearer;

  if (!token || token !== expected) {
    return NextResponse.json(
      {
        ok: false,
        error: 'UNAUTHED',
        message: 'Missing or invalid admin token.',
      },
      { status: 401 },
    );
  }

  return null; // ok
}
