// app/api/admin/dev-seed/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/app/api/admin/_auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function isDevRequest(req: Request) {
  const host = (req.headers.get('host') || '').toLowerCase();
  const vercelEnv = (process.env.VERCEL_ENV || '').toLowerCase(); // 'production' | 'preview' | 'development'
  // Hard block production
  if (vercelEnv === 'production') return false;
  // Allow dev subdomain, localhost, or preview
  if (host.startsWith('dev.') || host.includes('localhost') || vercelEnv === 'preview') return true;
  return true; // keep permissive in non-prod, tighten if you want
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomBase58(len: number) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[randInt(0, chars.length - 1)];
  return s;
}

function fakeWallet() {
  // Looks like a Solana base58 address length-ish
  return randomBase58(44);
}

function fakeTxUrl() {
  // Looks like a Solscan signature
  const sig = randomBase58(88);
  return `https://solscan.io/tx/${sig}`;
}

function startOfUtcDay(d = new Date()) {
  const yyyyMmDd = d.toISOString().slice(0, 10);
  return new Date(`${yyyyMmDd}T00:00:00.000Z`);
}
function endOfUtcDay(d = new Date()) {
  const yyyyMmDd = d.toISOString().slice(0, 10);
  return new Date(`${yyyyMmDd}T23:59:59.999Z`);
}

export async function POST(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  if (!isDevRequest(req)) {
    return NextResponse.json(
      { ok: false, error: 'DEV_ONLY', message: 'Dev seed is disabled in production.' },
      { status: 403 },
    );
  }

  const url = new URL(req.url);
  const force = url.searchParams.get('force') === '1';

  const now = new Date();
  const start = startOfUtcDay(now);
  const end = endOfUtcDay(now);

  // Detect "empty"
  const [drawCount, ticketCount, bonusCount] = await Promise.all([
    prisma.draw.count(),
    prisma.ticket.count(),
    // adjust model name if yours differs
    (prisma as any).bonusDrop?.count?.() ?? Promise.resolve(0),
  ]);

  const isEmpty = drawCount === 0 && ticketCount === 0 && bonusCount === 0;
  if (!force && !isEmpty) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      message: 'DB is not empty - skipping seed (use ?force=1 to override).',
      counts: { drawCount, ticketCount, bonusCount },
    });
  }

  // 1) Ensure today's draw exists
  let draw = await prisma.draw.findFirst({
    where: { drawDate: { gte: start, lt: end } },
  });

  if (!draw) {
    draw = await prisma.draw.create({
      data: {
        drawDate: start, // you use drawDate in your /today route
        status: 'open',
        jackpotUsd: 229.64,
        rolloverUsd: 0,
        ticketsCount: 0,
        closesAt: new Date(Date.now() + 60 * 60 * 1000), // +1h
      } as any,
    });
  }

  // 2) Create demo tickets (fresh every force seed, otherwise only if empty)
  const ticketRows = Array.from({ length: 10 }).map((_, i) => ({
    drawId: draw!.id,
    code: `XPOT-${randInt(100000, 999999)}-${i + 1}`,
    walletAddress: fakeWallet(),
    status: 'in-draw',
    jackpotUsd: 229.64,
  }));

  await prisma.ticket.createMany({ data: ticketRows as any });

  // Update ticketsCount for draw (optional but nice)
  const newTicketCount = await prisma.ticket.count({ where: { drawId: draw!.id } });
  await prisma.draw.update({
    where: { id: draw!.id },
    data: { ticketsCount: newTicketCount } as any,
  });

  // 3) Create an upcoming bonus drop (if model exists)
  try {
    const bonusDropModel = (prisma as any).bonusDrop;
    if (bonusDropModel?.create) {
      await bonusDropModel.create({
        data: {
          drawId: draw!.id,
          label: 'Bonus XPOT',
          amountXpot: 100000,
          scheduledAt: new Date(Date.now() + 15 * 60 * 1000), // +15m
          status: 'SCHEDULED',
        },
      });
    }
  } catch {}

  // 4) Create a fake "paid" winner row if your model exists
  // IMPORTANT: Adjust model/fields to match your Prisma schema.
  try {
    const winnerModel = (prisma as any).winner;
    if (winnerModel?.create) {
      const firstTicket = await prisma.ticket.findFirst({ where: { drawId: draw!.id } });
      if (firstTicket) {
        await winnerModel.create({
          data: {
            drawId: draw!.id,
            date: start,
            ticketCode: firstTicket.code,
            walletAddress: firstTicket.walletAddress,
            jackpotUsd: 229.64,
            payoutUsd: 1000000,
            isPaidOut: true,
            txUrl: fakeTxUrl(),
            kind: 'main',
            label: 'Main XPOT',
          },
        });
      }
    }
  } catch {}

  return NextResponse.json({ ok: true, seeded: true });
}
