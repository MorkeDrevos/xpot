// lib/admin-auth.ts
import { NextRequest, NextResponse } from 'next/server';

const ADMIN_HEADER = 'x-admin-token';

function getAdminTokenFromEnv(): string | null {
  const token = process.env.XPOT_ADMIN_TOKEN ?? null;
  if (!token) {
    console.warn('[XPOT] XPOT_ADMIN_TOKEN is not set on this environment.');
  }
  return token;
}

/**
 * Checks if the incoming request is from an admin.
 *
 * - Looks for x-admin-token header
 * - Or "Authorization: Bearer <token>"
 * - Compares against XPOT_ADMIN_TOKEN from env
 *
 * Returns:
 *   - NextResponse (401 / 500) if not allowed
 *   - null if everything is OK and you can continue
 */
export function requireAdmin(request: NextRequest): NextResponse | null {
  const envToken = getAdminTokenFromEnv();

  if (!envToken) {
    return NextResponse.json(
      { ok: false, error: 'ADMIN_TOKEN_NOT_CONFIGURED' },
      { status: 500 }
    );
  }

  // Header A: x-admin-token: <token>
  const headerToken = request.headers.get(ADMIN_HEADER);

  // Header B: Authorization: Bearer <token>
  const bearer = request.headers.get('authorization');
  const bearerToken = bearer?.toLowerCase().startsWith('bearer ')
    ? bearer.slice(7).trim()
    : null;

  const incomingToken = headerToken ?? bearerToken ?? null;

  if (!incomingToken || incomingToken !== envToken) {
    return NextResponse.json(
      { ok: false, error: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  // All good – caller is admin
  return null;
}
