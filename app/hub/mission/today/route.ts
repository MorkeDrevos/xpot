// app/api/hub/mission/today/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

function utcYmd(d = new Date()) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function seededPick<T>(seed: string, arr: T[]) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const idx = Math.abs(h) % arr.length;
  return arr[idx];
}

export async function GET(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ ok: false, error: 'UNAUTHENTICATED' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const seedExtra = String(searchParams.get('seed') ?? '');

    const ymd = utcYmd();
    const existing = await prisma.dailyMission.findUnique({ where: { ymd } });

    if (existing) {
      return NextResponse.json(
        { ok: true, mission: { title: existing.title, desc: existing.desc, ymd } },
        { status: 200 },
      );
    }

    const pool = [
      { title: 'Lock your identity', desc: 'Make sure your X handle is linked and visible in the dashboard.' },
      { title: 'Verify eligibility', desc: 'Confirm your XPOT balance meets the minimum for today’s entry.' },
      { title: 'Claim your entry', desc: 'Issue today’s ticket and keep your code ready.' },
      { title: 'Proof mindset', desc: 'After draw time, verify the winners payout in an explorer.' },
      { title: 'Invite one holder', desc: 'Bring one new holder in - XPOT grows on reputation.' },
      { title: 'Stay consistent', desc: 'Show up daily. Streaks will matter after launch.' },
    ];

    const picked = seededPick(`${ymd}|${seedExtra}|xpot`, pool);

    const created = await prisma.dailyMission.create({
      data: {
        ymd,
        title: picked.title,
        desc: picked.desc,
      },
    });

    return NextResponse.json(
      { ok: true, mission: { title: created.title, desc: created.desc, ymd } },
      { status: 200 },
    );
  } catch (err: any) {
    console.error('[XPOT] /api/hub/mission/today error:', err);
    return NextResponse.json({ ok: false, error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
