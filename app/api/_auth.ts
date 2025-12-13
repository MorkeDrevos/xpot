import { NextRequest } from 'next/server';

const ADMIN_HEADER = 'x-xpot-admin-key';

/**
 * Shared admin-key guard for /api/admin/* routes.
 * Intentionally tiny and dependency-free.
 */
export function requireAdmin(req: NextRequest) {
  const expected = process.env.XPOT_OPS_ADMIN_KEY ?? '';
  const incoming = req.headers.get(ADMIN_HEADER) ?? '';

  if (!expected || incoming !== expected) {
    throw new Error('UNAUTHORIZED_ADMIN');
  }
}
