// app/api/admin/bonus-schedule/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const MIN_AMOUNT = 100_000;
const ALLOWED_DELAYS = [5, 15, 30, 60];

// Small helper – same logic as on the client side: admin token
// is sent either as a Bearer token or via the legacy header.
function requireAdmin(req: NextRequest): NextResponse | null {
  const secret = process.env.XPOT_ADMIN_TOKEN;

  if (!secret) {
    return NextResponse.json(
      { ok: false, error: 'Admin token not configured on server.' },
      { status: 500 },
    );
  }

  const authHeader = req.headers.get('authorization');
  const legacyHeader = req.headers.get('x-xpot-admin-token');

  let token = '';

  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  }
  if (!token && legacyHeader) {
    token = legacyHeader.trim();
  }

  if (!token || token !== secret) {
    return NextResponse.json(
      { ok: false, error: 'Invalid admin token.' },
      { status: 401 },
    );
  }

  return null;
}

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // 1) Auth
  const auth = requireAdmin(req);
  if (auth) return auth;

  // 2) Parse body
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid JSON body.' },
      { status: 400 },
    );
  }

  const amountXpot = Number(body.amountXpot);
  const delayMinutes = Number(body.delayMinutes);
  const labelRaw = (body.label ?? 'Bonus XPOT').toString();

  const label = labelRaw.slice(0, 120).trim() || 'Bonus XPOT';

  // 3) Basic validation (mirrors frontend)
  if (!Number.isFinite(amountXpot) || amountXpot < MIN_AMOUNT) {
    return NextResponse.json(
      { ok: false, error: 'Enter a valid XPOT amount (min 100,000).' },
      { status: 400 },
    );
  }

  if (!ALLOWED_DELAYS.includes(delayMinutes)) {
    return NextResponse.json(
      { ok: false, error: 'Select a valid bonus timer.' },
      { status: 400 },
    );
  }

  // 4) Compute scheduledAt
  const now = new Date();
  const scheduledAt = new Date(now.getTime() + delayMinutes * 60 * 1000);

  // 5) Store in DB
  // NOTE: adjust the model name if needed:
  //  - if your Prisma model is `model BonusDrop { ... }`, use prisma.bonusDrop
  //  - if it is `model XpotBonusDrop { ... }`, use prisma.xpotBonusDrop
  const drop = await prisma.bonusDrop.create({
  data: {
    drawId: todayDraw.id,
    label,
    amountXpot,
    scheduledAt,
    status: 'SCHEDULED',
  },
});

  return NextResponse.json({ ok: true, drop });
}

// Optional: if someone hits it with GET, just say “method not allowed”
export async function GET() {
  return NextResponse.json(
    { ok: false, error: 'Use POST to schedule a bonus XPOT drop.' },
    { status: 405 },
  );
}
