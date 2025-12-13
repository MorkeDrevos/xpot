import { NextRequest } from 'next/server';

export function requireAdmin(req: NextRequest) {
  const expected = process.env.XPOT_OPS_ADMIN_KEY;
  const incoming = req.headers.get('x-xpot-admin-key');

  if (!expected || incoming !== expected) {
    throw new Error('Unauthorized');
  }
}
