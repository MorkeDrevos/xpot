import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function ymdUtc(d = new Date()) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function seededPick<T>(seed: string, arr: T[]): T {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const idx = Math.abs(h) % arr.length;
  return arr[idx];
}

const FALLBACK_MISSIONS: Array<{ title: string; desc: string }> = [
  { title: 'Lock your identity', desc: 'Make sure your X handle is linked and visible in the dashboard.' },
  { title: 'Verify eligibility', desc: 'Confirm your XPOT balance meets the minimum for today’s entry.' },
  { title: 'Claim your entry', desc: 'Issue today’s ticket and keep your code safe.' },
  { title: 'Proof mindset', desc: 'After draw time, verify the winner payout in an explorer.' },
  { title: 'Invite one holder', desc: 'Bring one new holder in - XPOT grows on reputation.' },
  { title: 'Stay consistent', desc: 'Show up daily. Streaks will matter after launch.' },
];

export async function GET(req: Request) {
  const url = new URL(req.url);
  const seed = url.searchParams.get('seed') ?? '';
  const today = ymdUtc();

  const existing = await prisma.dailyMission.findUnique({ where: { ymd: today } });
  if (existing) {
    return NextResponse.json({
      ok: true,
      mission: { title: existing.title, desc: existing.desc, ymd: existing.ymd },
    });
  }

  // deterministic creation (stable across deploys)
  const picked = seededPick(`${today}|xpot-mission|${seed}`, FALLBACK_MISSIONS);

  const created = await prisma.dailyMission.create({
    data: { ymd: today, title: picked.title, desc: picked.desc },
  });

  return NextResponse.json({
    ok: true,
    mission: { title: created.title, desc: created.desc, ymd: created.ymd },
  });
}
