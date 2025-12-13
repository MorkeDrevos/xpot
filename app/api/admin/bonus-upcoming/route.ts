// app/api/admin/bonus-upcoming/route.ts
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { requireAdmin } from '../_auth';

// keep your existing logic below, but add the guard first
export async function GET(req: Request) {
  const denied = requireAdmin(req as any);
  if (denied) return denied;

  // ...rest of your existing code that returns drops...
}
