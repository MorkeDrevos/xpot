// app/api/hub/mission/today/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

function ymdUtc(d = new Date()) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function seededPick<T>(seed: string, arr: T[]): T {
  let h = 2166136261; // FNV-1a
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const idx = Math.abs(h) % arr.length;
  return arr[idx];
}

const MISSIONS: Array<{ title: string; desc: string }> = [
  { title: 'Lock your identity', desc: 'Make sure your X handle is linked and visible in your hub.' },
  { title: 'Verify eligibility', desc: 'Confirm you meet today’s entry requirements before you submit.' },
  { title: 'Claim your entry', desc: 'Issue today’s ticket and keep your code safe.' },
  { title: 'Proof mindset', desc: 'After draw time, verify the winner payout in an explorer.' },
  { title: 'Invite one holder', desc: 'Bring one new holder in - XPOT grows on reputation.' },
  { title: 'Stay consistent', desc: 'Show up daily. Consistency will matter.' },
];

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const seed = url.searchParams.get('seed') ?? '';
    const today = ymdUtc();

    // Deterministic mission (stable across deploys) without touching DB
    const picked = seededPick(`${today}|xpot-mission|${seed}`, MISSIONS);

    return NextResponse.json(
      {
        ok: true,
        mission: {
          ymd: today,
          title: picked.title,
          desc: picked.desc,
        },
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error('[XPOT] /api/hub/mission/today GET error:', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
